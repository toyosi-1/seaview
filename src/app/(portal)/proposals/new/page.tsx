'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Loader2, Upload, ArrowLeft, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { compressImage, compressFiles } from '@/lib/utils/compress'
import { notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'

interface TenderOption {
  id: string
  title: string
  contract_number: string
  description: string
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] bg-slate-50" />}>
      <NewProposalContent />
    </Suspense>
  )
}

function NewProposalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetTenderId = searchParams.get('tender')

  const [loading, setLoading] = useState(false)
  const [tenders, setTenders] = useState<TenderOption[]>([])
  const [selectedTenderId, setSelectedTenderId] = useState(presetTenderId ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [proposalDoc, setProposalDoc] = useState<File | null>(null)
  const [supportingDocs, setSupportingDocs] = useState<FileList | null>(null)

  useEffect(() => {
    async function loadTenders() {
      const supabase = createClient()
      const { data } = await supabase
        .from('tenders')
        .select('id,title,contract_number,description')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      const list = (data ?? []) as unknown as TenderOption[]
      setTenders(list)
      if (presetTenderId) {
        const t = list.find(t => t.id === presetTenderId)
        if (t) {
          setTitle(t.title)
          setDescription(t.description)
        }
      }
    }
    loadTenders()
  }, [presetTenderId])

  function handleTenderSelect(tenderId: string) {
    setSelectedTenderId(tenderId)
    const t = tenders.find(t => t.id === tenderId)
    if (t) {
      setTitle(t.title)
      setDescription(t.description)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenderId) {
      toast.error('Please select a contract to apply for')
      return
    }
    if (!title || !description || !estimatedCost) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: contractorRaw } = await supabase
        .from('contractors').select('id,status').eq('user_id', user.id).maybeSingle()
      const contractor = contractorRaw as unknown as { id: string; status: string } | null
      if (!contractor) throw new Error('Contractor profile not found. Please complete registration.')
      if (contractor.status !== 'active') throw new Error('Your contractor account is not yet active. Please wait for verification.')

      // Check for duplicate proposal
      const { count } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('tender_id', selectedTenderId)
        .eq('contractor_id', contractor.id)
      if ((count ?? 0) > 0) {
        throw new Error('You have already submitted a quotation for this contract.')
      }

      const estimatedCostValue = parseFloat(estimatedCost.replace(/,/g, ''))
      if (!Number.isFinite(estimatedCostValue) || estimatedCostValue < 0) {
        throw new Error('Estimated cost must be a non-negative number')
      }

      // Create proposal
      const { data: proposalRaw, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          contractor_id: contractor.id,
          tender_id: selectedTenderId,
          title: title.trim(),
          description: description.trim(),
          estimated_cost: estimatedCostValue,
          status: 'submitted',
          current_stage: 'md_review',
        })
        .select()
        .maybeSingle()
      if (proposalError) throw proposalError
      if (!proposalRaw) throw new Error('Failed to create proposal')
      const proposal = proposalRaw as unknown as { id: string }

      // Upload proposal document (compress if image)
      if (proposalDoc) {
        const compressed = await compressImage(proposalDoc)
        const ext = compressed.name.split('.').pop()
        const path = `proposals/${proposal.id}/proposal-doc.${ext}`
        await supabase.storage.from('documents').upload(path, compressed)
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
        await supabase.from('proposal_documents').insert({
          proposal_id: proposal.id,
          document_type: 'proposal_document',
          file_name: proposalDoc.name,
          file_url: publicUrl,
          file_size: compressed.size,
          uploaded_by: user.id,
        })
      }

      // Upload supporting docs (compress images)
      if (supportingDocs) {
        const compressedFiles = await compressFiles(supportingDocs)
        const uploads = compressedFiles.map(async (file, i) => {
          const ext = file.name.split('.').pop()
          const path = `proposals/${proposal.id}/supporting-${i}.${ext}`
          await supabase.storage.from('documents').upload(path, file)
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
          await supabase.from('proposal_documents').insert({
            proposal_id: proposal.id,
            document_type: 'supporting',
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            uploaded_by: user.id,
          })
        })
        await Promise.all(uploads)
      }

      // Add timeline entry
      await supabase.from('proposal_timeline').insert({
        proposal_id: proposal.id,
        actor_id: user.id,
        stage: 'submitted',
        action: 'Quotation submitted',
        note: `Quotation submitted for review. Estimated cost: ₦${parseFloat(estimatedCost.replace(/,/g, '')).toLocaleString()}`,
      })

      // Audit log
      await logAudit({
        userId: user.id,
        userRole: 'contractor',
        action: 'Quotation submitted',
        entityType: 'proposal',
        entityId: proposal.id,
        newStatus: 'submitted',
      })

      // Notify MD of new proposal
      const mdStaff = await getStaffByRole('md')
      await notifyMany(mdStaff.map(s => ({
        userId: s.id,
        type: 'proposal_submitted',
        title: 'New Quotation Submitted',
        message: `A new quotation "${title.trim()}" has been submitted and requires your review.`,
        referenceId: proposal.id,
        referenceType: 'proposal',
      })))

      toast.success('Quotation submitted successfully!')
      router.push(`/proposals/${proposal.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit quotation')
    } finally {
      setLoading(false)
    }
  }

  const selectedTender = tenders.find(t => t.id === selectedTenderId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href={selectedTenderId ? `/tenders/${selectedTenderId}` : '/tenders'}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Submit Quotation</h1>
          <p className="text-slate-500 mt-0.5">Select a contract and fill in your quotation details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contract Selection */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-spl-blue" />
              Select Contract *
            </CardTitle>
            <CardDescription>Choose the contract you want to submit a quotation for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenders.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No open contracts available</p>
                <Button asChild className="mt-3 bg-spl-blue hover:bg-spl-blue-dark text-white" size="sm">
                  <Link href="/tenders">Browse Contracts</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tenders.map(tender => (
                  <label
                    key={tender.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedTenderId === tender.id ? 'border-spl-blue bg-spl-blue-light' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tender"
                      value={tender.id}
                      checked={selectedTenderId === tender.id}
                      onChange={e => handleTenderSelect(e.target.value)}
                      className="mt-1 w-4 h-4 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base">{tender.title}</p>
                      <p className="text-sm text-slate-500 font-mono">{tender.contract_number}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposal Details */}
        {selectedTender && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Quotation Details</CardTitle>
            <CardDescription>Review and adjust the details for your quotation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Quotation Title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Construction of Warehouse Facility"
                className="h-12 text-base capitalize"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Description *</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the proposed work, scope, timeline, and deliverables..."
                className="min-h-[140px] text-base resize-none capitalize"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Estimated Cost (₦) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-base">₦</span>
                <Input
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  placeholder="5,000,000"
                  className="h-12 text-base pl-8"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Documents */}
        {selectedTender && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Documents</CardTitle>
            <CardDescription>Upload your quotation document and any supporting files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Quotation Document (PDF, Word, or Excel)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">Click to upload or drag and drop</p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  onChange={e => setProposalDoc(e.target.files?.[0] ?? null)}
                  className="h-10 cursor-pointer max-w-xs mx-auto"
                />
                {proposalDoc && (
                  <p className="text-sm text-spl-success font-medium mt-2">✓ {proposalDoc.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Supporting Documents (optional, multiple)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">Upload any additional supporting documents</p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                  multiple
                  onChange={e => setSupportingDocs(e.target.files)}
                  className="h-10 cursor-pointer max-w-xs mx-auto"
                />
                {supportingDocs && supportingDocs.length > 0 && (
                  <p className="text-sm text-spl-success font-medium mt-2">
                    ✓ {supportingDocs.length} file{supportingDocs.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {selectedTender && (
        <div className="flex gap-4 pb-8">
          <Button asChild variant="outline" size="lg" className="flex-1 h-12 text-base">
            <Link href={selectedTenderId ? `/tenders/${selectedTenderId}` : '/tenders'}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedTenderId || !title || !description || !estimatedCost}
            size="lg"
            className="flex-1 h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</>
            ) : (
              <><FileText className="w-5 h-5 mr-2" />Submit Quotation</>
            )}
          </Button>
        </div>
        )}
      </form>
    </div>
  )
}
