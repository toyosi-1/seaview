'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RotateCcw, Loader2, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { CompletionReport, Profile } from '@/types/database'
import { notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'
import { reviewerRoleForStatus } from './CompletionActions'
import { compressImage } from '@/lib/utils/compress'

interface ResubmitCompletionProps {
  completion: CompletionReport
  profile: Profile
  projectSupervisorId?: string | null
}

export function ResubmitCompletion({ completion, profile, projectSupervisorId }: ResubmitCompletionProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<FileList | null>(null)
  const [supporting, setSupporting] = useState<FileList | null>(null)
  const [completionReport, setCompletionReport] = useState<File | null>(null)

  async function handleResubmit() {
    if (!comment.trim()) {
      toast.error('Please add a note describing what was corrected')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { data: contractorRaw } = await supabase.from('contractors').select('status').eq('user_id', user.id).maybeSingle()
      const contractor = contractorRaw as unknown as { status: string } | null
      if (contractor && contractor.status !== 'active') throw new Error('Your contractor account is suspended. You cannot resubmit completion reports.')

      const uploadFile = async (file: File, type: string) => {
        const compressed = await compressImage(file)
        const ext = compressed.name.split('.').pop() || 'bin'
        const path = `completions/${completion.id}/${type}-resubmit-${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(path, compressed)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
        const { error: documentError } = await supabase.from('completion_documents').insert({
          completion_id: completion.id,
          document_type: type,
          file_name: file.name,
          file_url: publicUrl,
          file_size: compressed.size,
          uploaded_by: user.id,
        })
        if (documentError) throw documentError
      }

      const uploads: Promise<void>[] = []
      if (completionReport) uploads.push(uploadFile(completionReport, 'completion_report'))
      if (images) Array.from(images).forEach(f => uploads.push(uploadFile(f, 'image')))
      if (supporting) Array.from(supporting).forEach(f => uploads.push(uploadFile(f, 'supporting')))
      await Promise.all(uploads)

      const { error } = await supabase
        .from('completion_reports')
        .update({
          correction_requested: false,
          correction_response: comment.trim(),
          correction_responded_at: new Date().toISOString(),
        } as Partial<CompletionReport>)
        .eq('id', completion.id)
        .eq('contractor_id', completion.contractor_id)
        .eq('correction_requested', true)
      if (error) throw error

      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: `Resubmitted After Correction: ${comment.trim()}`,
        entityType: 'completion_report',
        entityId: completion.id,
        previousStatus: completion.status,
        newStatus: completion.status,
      })

      const reviewerRole = reviewerRoleForStatus(completion.status)
      if (reviewerRole) {
        const staff = await getStaffByRole(reviewerRole)
        await notifyMany(staff.map(s => ({
          userId: s.id,
          type: 'completion_submitted',
          title: 'Completion Report Resubmitted',
          message: `Completion report "${completion.title}" was resubmitted after correction: ${comment.trim()}`,
          referenceId: completion.id,
          referenceType: 'completion',
        })))
      } else if (projectSupervisorId) {
        await notifyMany([{
          userId: projectSupervisorId,
          type: 'completion_submitted',
          title: 'Completion Report Resubmitted',
          message: `Completion report "${completion.title}" was resubmitted after correction: ${comment.trim()}`,
          referenceId: completion.id,
          referenceType: 'completion',
        }])
      }

      toast.success('Completion report resubmitted successfully')
      setComment('')
      setImages(null)
      setSupporting(null)
      setCompletionReport(null)
      router.push('/completions')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resubmit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 bg-slate-50 rounded-2xl space-y-4 border border-slate-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-spl-warning flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-slate-800 text-base">Correction Required — Resubmit</h3>
          {completion.correction_reason && (
            <p className="text-sm text-spl-warning mt-1">
              <strong>Reviewer&apos;s note:</strong> {completion.correction_reason}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Upload updated evidence/documents and add a note describing what was corrected, then resubmit for review.
      </p>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-600">Response / Correction Details *</Label>
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Explain what was corrected..."
          className="min-h-[90px] bg-white resize-none text-base"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-600">Upload Updated Evidence (optional)</Label>

        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">Completion Report (PDF)</p>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setCompletionReport(e.target.files?.[0] ?? null)} className="h-10 cursor-pointer max-w-xs mx-auto" />
            {completionReport && <p className="text-sm text-spl-success font-medium mt-1">✓ {completionReport.name}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">Completion Images (multiple allowed)</p>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <Input type="file" accept=".png,.jpg,.jpeg,.webp" multiple onChange={e => setImages(e.target.files)} className="h-10 cursor-pointer max-w-xs mx-auto" />
            {images && images.length > 0 && <p className="text-sm text-spl-success font-medium mt-1">✓ {images.length} image{images.length > 1 ? 's' : ''} selected</p>}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">Additional Supporting Documents</p>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <Input type="file" multiple onChange={e => setSupporting(e.target.files)} className="h-10 cursor-pointer max-w-xs mx-auto" />
            {supporting && supporting.length > 0 && <p className="text-sm text-spl-success font-medium mt-1">✓ {supporting.length} file{supporting.length > 1 ? 's' : ''} selected</p>}
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleResubmit}
        disabled={loading || !comment.trim()}
        size="lg"
        className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
        Resubmit for Review
      </Button>
    </div>
  )
}
