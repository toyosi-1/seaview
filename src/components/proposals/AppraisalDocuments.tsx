'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload, FileText, Trash2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import type { ProposalDocument } from '@/types/database'

const ACCEPTED_TYPES = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

interface AppraisalDocumentsProps {
  proposalId: string
}

export function AppraisalDocuments({ proposalId }: AppraisalDocumentsProps) {
  const [documents, setDocuments] = useState<ProposalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('proposal_documents')
        .select('*')
        .eq('proposal_id', proposalId)
        .eq('document_type', 'appraisal_document')
        .order('created_at', { ascending: false })

      if (error) throw error
      const docs = (data ?? []) as unknown as ProposalDocument[]
      setDocuments(docs)

      // Generate signed URLs for each document
      const urlMap: Record<string, string> = {}
      await Promise.all(
        docs.map(async (doc) => {
          // Extract path from file_url — stored as path in appraisal-documents bucket
          // We store the path, not a public URL, for private bucket files
          const path = doc.file_url
          const { data: urlData, error: urlError } = await supabase
            .storage
            .from('appraisal-documents')
            .createSignedUrl(path, 3600)

          if (!urlError && urlData?.signedUrl) {
            urlMap[doc.id] = urlData.signedUrl
          }
        })
      )
      setSignedUrls(urlMap)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load appraisal documents')
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  useEffect(() => {
    // eslint-disable-next-line
    fetchDocuments()
  }, [fetchDocuments])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return

    // Validate file sizes
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds the 10MB limit`)
        return
      }
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const uploads = Array.from(files).map(async (file, i) => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
        const timestamp = Date.now()
        const path = `proposals/${proposalId}/appraisal-${timestamp}-${i}.${ext}`

        const { error: uploadError } = await supabase
          .storage
          .from('appraisal-documents')
          .upload(path, file)

        if (uploadError) throw uploadError

        const { error: dbError } = await supabase
          .from('proposal_documents')
          .insert({
            proposal_id: proposalId,
            document_type: 'appraisal_document',
            file_name: file.name,
            file_url: path,
            file_size: file.size,
            uploaded_by: user.id,
          })

        if (dbError) throw dbError
      })

      await Promise.all(uploads)
      toast.success(`${files.length} document(s) uploaded successfully`)
      await fetchDocuments()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc: ProposalDocument) {
    try {
      const supabase = createClient()

      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('appraisal-documents')
        .remove([doc.file_url])

      if (storageError) throw storageError

      // Delete metadata
      const { error: dbError } = await supabase
        .from('proposal_documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) throw dbError

      toast.success('Document deleted')
      await fetchDocuments()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Supporting Appraisal Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Optional supporting documents for this appraisal. These are visible to internal staff only.
        </p>

        {/* Upload button */}
        <div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={uploading}
            >
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Documents'}
              </span>
            </Button>
            <input
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Document list */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : !documents.length ? (
          <p className="text-slate-400 text-center py-6 text-sm">No appraisal documents uploaded</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
              >
                <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{doc.file_name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</p>
                </div>
                {signedUrls[doc.id] && (
                  <a
                    href={signedUrls[doc.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-spl-blue hover:text-spl-blue-dark font-medium"
                  >
                    View
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
