'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Upload, ArrowLeft, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Contract } from '@/types/database'
import { compressImage } from '@/lib/utils/compress'
import { notify, logAudit } from '@/lib/utils/notify'

export default function NewCompletionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contractId = searchParams.get('contract_id')

  const [loading, setLoading] = useState(false)
  const [contract, setContract] = useState<Contract | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [completionReport, setCompletionReport] = useState<File | null>(null)
  const [certificate, setCertificate] = useState<File | null>(null)
  const [images, setImages] = useState<FileList | null>(null)
  const [supporting, setSupporting] = useState<FileList | null>(null)

  useEffect(() => {
    if (!contractId) return
    const supabase = createClient()
    supabase.from('contracts').select('*').eq('id', contractId).single().then(({ data }) => {
      if (data) setContract(data as unknown as Contract)
    })
  }, [contractId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contractId) { toast.error('No contract selected'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: contractorRaw } = await supabase.from('contractors').select('id').eq('user_id', user.id).single()
      if (!contractorRaw) throw new Error('Contractor profile not found')
      const contractor = contractorRaw as unknown as { id: string }

      const { data: crRaw, error } = await supabase
        .from('completion_reports')
        .insert({
          contract_id: contractId,
          contractor_id: contractor.id,
          title: title.trim(),
          description: description.trim(),
          status: 'supervisor_review',
        } as never)
        .select()
        .single()
      if (error) throw error
      const cr = crRaw as unknown as { id: string }

      const uploadFile = async (file: File, type: string, index = 0) => {
        const compressed = await compressImage(file)
        const ext = compressed.name.split('.').pop()
        const path = `completions/${cr.id}/${type}-${index}.${ext}`
        await supabase.storage.from('documents').upload(path, compressed)
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
        await supabase.from('completion_documents').insert({
          completion_id: cr.id,
          document_type: type,
          file_name: file.name,
          file_url: publicUrl,
          file_size: compressed.size,
          uploaded_by: user.id,
        } as never)
      }

      const uploads: Promise<void>[] = []
      if (completionReport) uploads.push(uploadFile(completionReport, 'completion_report'))
      if (certificate) uploads.push(uploadFile(certificate, 'certificate'))
      if (images) Array.from(images).forEach((f, i) => uploads.push(uploadFile(f, 'image', i)))
      if (supporting) Array.from(supporting).forEach((f, i) => uploads.push(uploadFile(f, 'supporting', i)))
      await Promise.all(uploads)

      // Audit log
      await logAudit({
        userId: user.id,
        userRole: 'contractor',
        action: 'Completion report submitted',
        entityType: 'completion_report',
        entityId: cr.id,
        newStatus: 'supervisor_review',
      })

      // Notify project supervisor
      const { data: contractRaw } = await supabase
        .from('contracts').select('project_supervisor_id').eq('id', contractId).single()
      const typedContract2 = contractRaw as unknown as { project_supervisor_id: string | null } | null
      if (typedContract2?.project_supervisor_id) {
        await notify({
          userId: typedContract2.project_supervisor_id,
          type: 'completion_submitted',
          title: 'Completion Report Requires Your Review',
          message: `A completion report "${title.trim()}" has been submitted and requires your review.`,
          referenceId: cr.id,
          referenceType: 'completion',
        })
      }

      toast.success('Completion report submitted successfully!')
      router.push(`/completions/${cr.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/completions"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Submit Completion Report</h1>
          {contract && <p className="text-slate-500 mt-0.5">For contract: <strong>{contract.contract_number}</strong></p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Completion Details</CardTitle>
            <CardDescription>Describe the completed work and provide evidence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-medium">Report Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Warehouse Construction – Completion Report" className="h-12 text-base" required />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">Description of Work Completed *</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what was accomplished, key milestones achieved, and any relevant details..." className="min-h-[120px] text-base resize-none" required />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Upload Documents & Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Completion Report (PDF) *', setter: setCompletionReport, accept: '.pdf,.doc,.docx', multi: false, state: completionReport },
              { label: 'Completion Certificate *', setter: setCertificate, accept: '.pdf,.png,.jpg,.jpeg', multi: false, state: certificate },
            ].map(({ label, setter, accept, state }) => (
              <div key={label} className="space-y-2">
                <Label className="text-base font-medium">{label}</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 transition-colors">
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <Input type="file" accept={accept} onChange={e => setter(e.target.files?.[0] ?? null)} className="h-10 cursor-pointer max-w-xs mx-auto" />
                  {state && <p className="text-sm text-spl-success font-medium mt-2">✓ {state.name}</p>}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label className="text-base font-medium">Completion Images (multiple allowed)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 transition-colors">
                <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <Input type="file" accept=".png,.jpg,.jpeg,.webp" multiple onChange={e => setImages(e.target.files)} className="h-10 cursor-pointer max-w-xs mx-auto" />
                {images && images.length > 0 && <p className="text-sm text-spl-success font-medium mt-2">✓ {images.length} image{images.length > 1 ? 's' : ''} selected</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Additional Supporting Documents</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 transition-colors">
                <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <Input type="file" multiple onChange={e => setSupporting(e.target.files)} className="h-10 cursor-pointer max-w-xs mx-auto" />
                {supporting && supporting.length > 0 && <p className="text-sm text-spl-success font-medium mt-2">✓ {supporting.length} file{supporting.length > 1 ? 's' : ''} selected</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pb-8">
          <Button asChild variant="outline" size="lg" className="flex-1 h-12 text-base">
            <Link href="/completions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !title || !description || !completionReport || !certificate} size="lg" className="flex-1 h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white">
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : <><ClipboardList className="w-5 h-5 mr-2" />Submit Report</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
