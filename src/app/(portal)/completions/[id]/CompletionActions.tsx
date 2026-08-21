'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CompletionReport, Profile, CompletionStatus } from '@/types/database'
import { notify, notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'

interface Action {
  label: string
  nextStatus: CompletionStatus
  color: string
  icon: React.ElementType
}

function getActions(status: CompletionStatus, role: string, isSupervisor: boolean): Action[] {
  if ((status === 'submitted' || status === 'supervisor_review') && isSupervisor) return [
    { label: 'Approve & Forward to MD', nextStatus: 'md_verification', color: 'bg-spl-blue hover:bg-spl-blue-dark', icon: ArrowRight },
    { label: 'Reject', nextStatus: 'rejected', color: 'bg-spl-danger hover:bg-spl-danger-dark', icon: XCircle },
  ]
  if (status === 'md_verification' && role === 'md') return [
    { label: 'Verify & Forward to Audit', nextStatus: 'audit_review', color: 'bg-spl-blue hover:bg-spl-blue-dark', icon: ArrowRight },
    { label: 'Reject', nextStatus: 'rejected', color: 'bg-spl-danger hover:bg-spl-danger-dark', icon: XCircle },
  ]
  if (status === 'audit_review' && role === 'head_of_audit') return [
    { label: 'Approve & Forward to Accounts', nextStatus: 'accounts_review', color: 'bg-spl-success hover:bg-spl-success-dark', icon: CheckCircle },
    { label: 'Reject', nextStatus: 'rejected', color: 'bg-spl-danger hover:bg-spl-danger-dark', icon: XCircle },
  ]
  if (status === 'accounts_review' && role === 'head_of_accounts') return [
    { label: 'Payment Made', nextStatus: 'payment_completed', color: 'bg-spl-success hover:bg-spl-success-dark', icon: CheckCircle },
    { label: 'Reject', nextStatus: 'rejected', color: 'bg-spl-danger hover:bg-spl-danger-dark', icon: XCircle },
  ]
  return []
}

interface CompletionActionsProps {
  completion: CompletionReport
  profile: Profile
  projectSupervisorId?: string | null
}

export function CompletionActions({ completion, profile, projectSupervisorId }: CompletionActionsProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [selected, setSelected] = useState<Action | null>(null)
  const [loading, setLoading] = useState(false)

  const isSupervisor = !!projectSupervisorId && projectSupervisorId === profile.id
  const actions = getActions(completion.status, profile.role, isSupervisor)
  if (actions.length === 0) return null

  async function handleAction() {
    if (!selected) return
    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const update: Record<string, unknown> = { status: selected.nextStatus }

      if (completion.status === 'submitted' || completion.status === 'supervisor_review') {
        update.supervisor_reviewed_at = now
        update.supervisor_reviewed_by = profile.id
        update.supervisor_notes = comment
        if (selected.nextStatus === 'rejected') update.rejection_reason = comment
      } else if (completion.status === 'md_verification') {
        update.md_verified_at = now
        update.md_verified_by = profile.id
        if (selected.nextStatus === 'rejected') update.rejection_reason = comment
      } else if (completion.status === 'audit_review') {
        update.audit_reviewed_at = now
        update.audit_reviewed_by = profile.id
        update.audit_comment = comment
        if (selected.nextStatus === 'rejected') update.rejection_reason = comment
      } else if (completion.status === 'accounts_review') {
        update.accounts_reviewed_at = now
        update.accounts_reviewed_by = profile.id
        if (selected.nextStatus === 'rejected') update.rejection_reason = comment

        // When payment is made, create completed payment record and close out contract
        if (selected.nextStatus === 'payment_completed') {
          const { data: contractor } = await supabase
            .from('contractors')
            .select('bank_name,account_number,account_name')
            .eq('id', completion.contractor_id)
            .maybeSingle()

          if (contractor) {
            const typedContractor = contractor as unknown as { bank_name: string; account_number: string; account_name: string }
            const { data: contractRaw } = await supabase
              .from('contracts').select('contract_value').eq('id', completion.contract_id).maybeSingle()
            const typedContract = contractRaw as unknown as { contract_value: number } | null

            await supabase.from('payments').insert({
              completion_id: completion.id,
              contract_id: completion.contract_id,
              contractor_id: completion.contractor_id,
              amount: typedContract?.contract_value ?? 0,
              bank_name: typedContractor.bank_name,
              account_number: typedContractor.account_number,
              account_name: typedContractor.account_name,
              tax_deduction: 0,
              net_amount: typedContract?.contract_value ?? 0,
              status: 'completed',
              approved_by: profile.id,
              approved_at: now,
              payment_date: now,
              payment_reference: null,
              notes: null,
            })
          }

          // Close out the contract
          await supabase
            .from('contracts')
            .update({ status: 'completed' })
            .eq('id', completion.contract_id)
        }
      }

      const { error } = await supabase
        .from('completion_reports')
        .update(update as Partial<CompletionReport>)
        .eq('id', completion.id)
      if (error) throw error

      // Audit log
      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: selected.label,
        entityType: 'completion_report',
        entityId: completion.id,
        previousStatus: completion.status,
        newStatus: selected.nextStatus,
      })

      // Notify contractor
      const { data: contractorRaw } = await supabase
        .from('contractors').select('user_id').eq('id', completion.contractor_id).maybeSingle()
      const contractor = contractorRaw as unknown as { user_id: string } | null
      if (contractor) {
        const isReject = selected.nextStatus === 'rejected'
        const isPaymentDone = selected.nextStatus === 'payment_completed'
        await notify({
          userId: contractor.user_id,
          type: isReject ? 'audit_rejected' : isPaymentDone ? 'payment_completed' : 'audit_approved',
          title: isReject ? 'Completion Report Rejected' : isPaymentDone ? 'Payment Completed' : 'Completion Report Updated',
          message: isPaymentDone
            ? `Your completion report "${completion.title}" has been approved and payment has been made to your account.`
            : `Your completion report "${completion.title}" has been ${selected.label.toLowerCase()}.`,
          referenceId: completion.id,
          referenceType: 'completion',
        })
      }

      // Notify next-stage staff
      if (selected.nextStatus !== 'rejected') {
        const nextRole = selected.nextStatus === 'md_verification' ? 'md'
          : selected.nextStatus === 'audit_review' ? 'head_of_audit'
          : selected.nextStatus === 'accounts_review' ? 'head_of_accounts'
          : null
        if (nextRole) {
          const staff = await getStaffByRole(nextRole)
          await notifyMany(staff.map(s => ({
            userId: s.id,
            type: 'completion_submitted',
            title: 'Completion Report Requires Your Action',
            message: `Completion report "${completion.title}" is now in ${selected.nextStatus.replace(/_/g, ' ')} stage.`,
            referenceId: completion.id,
            referenceType: 'completion',
          })))
        }
      }

      toast.success('Action completed successfully')
      setSelected(null)
      setComment('')
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
        <h3 className="font-bold text-slate-800 text-base">Your Action Required</h3>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">Comment *</Label>
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add your review comments..." className="min-h-[90px] bg-white resize-none text-base" />
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(a => {
            const Icon = a.icon
            return (
              <Button key={a.label} type="button" onClick={() => setSelected(a)} disabled={!comment.trim()} size="lg" className={`text-white h-11 ${a.color} disabled:opacity-40`}>
                <Icon className="w-4 h-4 mr-2" />{a.label}
              </Button>
            )
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Action</DialogTitle>
            <DialogDescription className="text-base mt-2">You are about to: <strong>{selected?.label}</strong></DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
            <strong>Comment:</strong><p className="mt-1 italic">&ldquo;{comment}&rdquo;</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setSelected(null)} className="flex-1 h-11" disabled={loading}>Cancel</Button>
            <Button type="button" onClick={handleAction} disabled={loading} className={`flex-1 h-11 text-white ${selected?.color}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
