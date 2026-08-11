'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, XCircle, PauseCircle, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Payment, Profile } from '@/types/database'
import { notify, logAudit } from '@/lib/utils/notify'
import { formatCurrency } from '@/lib/utils/format'

export function PaymentActions({ payment, profile }: { payment: Payment; profile: Profile }) {
  const router = useRouter()
  const [action, setAction] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState('')
  const [taxDeduction, setTaxDeduction] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAction() {
    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const update: Record<string, unknown> = { notes }

      if (action === 'approve') {
        update.status = 'completed'
        update.approved_by = profile.id
        update.approved_at = now
        update.payment_reference = reference
        update.payment_date = now
        update.tax_deduction = parseFloat(taxDeduction || '0')
        update.net_amount = payment.amount - parseFloat(taxDeduction || '0')
      } else if (action === 'hold') {
        update.status = 'on_hold'
      } else if (action === 'reject') {
        update.status = 'rejected'
      }

      const { error } = await supabase.from('payments').update(update as never).eq('id', payment.id)
      if (error) throw error

      // Upload evidence files
      if (action === 'approve' && evidenceFiles) {
        const uploads = Array.from(evidenceFiles).map(async (file, i) => {
          const ext = file.name.split('.').pop()
          const path = `payments/${payment.id}/evidence-${i}.${ext}`
          await supabase.storage.from('documents').upload(path, file)
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
          await supabase.from('payment_documents').insert({
            payment_id: payment.id,
            document_type: 'transfer_evidence',
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            uploaded_by: profile.id,
          } as never)
        })
        await Promise.all(uploads)
      }

      // Audit log
      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: action === 'approve' ? 'Approve & Process Payment' : action === 'hold' ? 'Put Payment On Hold' : 'Reject Payment',
        entityType: 'payment',
        entityId: payment.id,
        previousStatus: payment.status,
        newStatus: update.status as string,
      })

      // Notify contractor
      const { data: contractorRaw } = await supabase
        .from('contractors').select('user_id').eq('id', payment.contractor_id).single()
      const contractor = contractorRaw as unknown as { user_id: string } | null
      if (contractor) {
        const isCompleted = action === 'approve'
        const isRejected = action === 'reject'
        await notify({
          userId: contractor.user_id,
          type: isCompleted ? 'payment_completed' : isRejected ? 'payment_approved' : 'payment_approved',
          title: isCompleted ? 'Payment Completed' : isRejected ? 'Payment Rejected' : 'Payment On Hold',
          message: `Payment of ${formatCurrency(payment.amount)} for "${payment.contractors?.company_name ?? 'contract'}" has been ${action === 'approve' ? 'completed' : action === 'hold' ? 'put on hold' : 'rejected'}.`,
          referenceId: payment.id,
          referenceType: 'payment',
        })
      }

      toast.success('Payment updated successfully')
      setAction(null)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-5 bg-slate-50 rounded-2xl space-y-4 border border-slate-200">
        <h3 className="font-bold text-slate-800 text-base">Payment Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setAction('approve')} size="lg" className="bg-green-600 hover:bg-green-700 text-white h-11">
            <CheckCircle className="w-4 h-4 mr-2" />Approve & Process Payment
          </Button>
          <Button type="button" onClick={() => setAction('hold')} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white h-11">
            <PauseCircle className="w-4 h-4 mr-2" />Put On Hold
          </Button>
          <Button type="button" onClick={() => setAction('reject')} size="lg" variant="destructive" className="h-11">
            <XCircle className="w-4 h-4 mr-2" />Reject Payment
          </Button>
        </div>
      </div>

      <Dialog open={!!action} onOpenChange={() => setAction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl capitalize">
              {action === 'approve' ? 'Approve & Process Payment' : action === 'hold' ? 'Put Payment On Hold' : 'Reject Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {action === 'approve' && (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Payment Reference *</Label>
                  <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. FBN/TRF/2026/001234" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Tax Deduction (₦)</Label>
                  <Input value={taxDeduction} onChange={e => setTaxDeduction(e.target.value)} placeholder="0" className="h-11" type="number" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Upload Transfer Evidence</Label>
                  <Input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={e => setEvidenceFiles(e.target.files)} className="h-11 cursor-pointer" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="text-base font-medium">Notes *</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add relevant notes..." className="min-h-[80px] resize-none" />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setAction(null)} className="flex-1 h-11" disabled={loading}>Cancel</Button>
              <Button
                type="button"
                onClick={handleAction}
                disabled={loading || !notes.trim() || (action === 'approve' && !reference.trim())}
                className={`flex-1 h-11 text-white ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : action === 'hold' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
