'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Proposal, Profile, ProposalStatus } from '@/types/database'
import { notify, notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'

interface StageTransition {
  action: 'approve' | 'reject' | 'return' | 'forward'
  label: string
  nextStatus: ProposalStatus
  nextStage: string
  color: string
  icon: React.ElementType
}

function getTransitions(currentStatus: ProposalStatus, role: string): StageTransition[] {
  switch (currentStatus) {
    case 'submitted':
    case 'md_review':
      if (role !== 'md') return []
      return [
        { action: 'forward', label: 'Approve & Forward to Procurement', nextStatus: 'procurement_appraisal', nextStage: 'procurement_appraisal', color: 'bg-blue-600 hover:bg-blue-700', icon: ArrowRight },
        { action: 'return', label: 'Return for Clarification', nextStatus: 'returned', nextStage: 'md_review', color: 'bg-amber-500 hover:bg-amber-600', icon: RotateCcw },
        { action: 'reject', label: 'Reject Quotation', nextStatus: 'rejected', nextStage: 'md_review', color: 'bg-red-600 hover:bg-red-700', icon: XCircle },
      ]
    case 'procurement_appraisal':
    case 'procurement_review':
      if (role !== 'head_of_procurement') return []
      return [
        { action: 'forward', label: 'Complete Appraisal & Forward to MD', nextStatus: 'md_final_review', nextStage: 'md_final_review', color: 'bg-blue-600 hover:bg-blue-700', icon: ArrowRight },
        { action: 'return', label: 'Return for Clarification', nextStatus: 'returned', nextStage: 'procurement_appraisal', color: 'bg-amber-500 hover:bg-amber-600', icon: RotateCcw },
      ]
    case 'md_final_review':
      if (role !== 'md') return []
      return [
        { action: 'approve', label: 'Final Approval - Send to ICT', nextStatus: 'ict_assignment', nextStage: 'ict_assignment', color: 'bg-green-600 hover:bg-green-700', icon: CheckCircle },
        { action: 'reject', label: 'Reject Quotation', nextStatus: 'rejected', nextStage: 'md_final_review', color: 'bg-red-600 hover:bg-red-700', icon: XCircle },
        { action: 'return', label: 'Return for Clarification', nextStatus: 'returned', nextStage: 'md_final_review', color: 'bg-amber-500 hover:bg-amber-600', icon: RotateCcw },
      ]
    default:
      return []
  }
}

interface ApprovalPanelProps {
  proposal: Proposal
  profile: Profile
}

export function ApprovalPanel({ proposal, profile }: ApprovalPanelProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [selectedTransition, setSelectedTransition] = useState<StageTransition | null>(null)
  const [loading, setLoading] = useState(false)

  const transitions = getTransitions(proposal.status, profile.role)
  if (transitions.length === 0) return null

  async function handleAction() {
    if (!selectedTransition) return
    if (!comment.trim()) {
      toast.error('Please add a comment before proceeding')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

      // Update proposal status
      const updateData: Record<string, unknown> = {
        status: selectedTransition.nextStatus,
        current_stage: selectedTransition.nextStage,
      }

      if (selectedTransition.action === 'reject') updateData.rejection_reason = comment
      if (selectedTransition.action === 'return') updateData.return_reason = comment

      // Set reviewer fields
      const now = new Date().toISOString()
      if (proposal.status === 'submitted' || proposal.status === 'md_review') {
        updateData.md_reviewed_at = now
        updateData.md_reviewed_by = profile.id
      } else if (proposal.status === 'procurement_appraisal' || proposal.status === 'procurement_review') {
        updateData.procurement_reviewed_at = now
        updateData.procurement_reviewed_by = profile.id
        updateData.appraisal_notes = comment.trim()
      } else if (proposal.status === 'md_final_review') {
        updateData.md_final_approved_at = now
        updateData.md_final_approved_by = profile.id
      }

      const { error: updateError } = await supabase
        .from('proposals')
        .update(updateData as never)
        .eq('id', proposal.id)
      if (updateError) throw updateError

      // Add comment
      await supabase.from('proposal_comments').insert({
        proposal_id: proposal.id,
        author_id: profile.id,
        stage: proposal.status,
        comment: comment.trim(),
        action: selectedTransition.action,
      } as never)

      // Add timeline
      await supabase.from('proposal_timeline').insert({
        proposal_id: proposal.id,
        actor_id: profile.id,
        stage: selectedTransition.nextStage,
        action: selectedTransition.label,
        note: comment.trim(),
      } as never)

      // If final approval, create contract
      if (selectedTransition.action === 'approve' && proposal.status === 'md_final_review') {
        const { data: contractorRaw } = await supabase
          .from('contractors').select('id').eq('id', proposal.contractor_id).single()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _contractor = contractorRaw as unknown as { id: string } | null

        await supabase.from('contracts').insert({
          proposal_id: proposal.id,
          contractor_id: proposal.contractor_id,
          title: proposal.title,
          contract_value: proposal.estimated_cost,
          awarded_by: profile.id,
          contract_number: '',
          approval_reference: proposal.proposal_number,
        } as never)
      }

      // Audit log
      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: selectedTransition.label,
        entityType: 'proposal',
        entityId: proposal.id,
        previousStatus: proposal.status,
        newStatus: selectedTransition.nextStatus,
      })

      // Notifications
      const notifType = selectedTransition.action === 'reject' ? 'proposal_rejected'
        : selectedTransition.action === 'return' ? 'proposal_returned'
        : selectedTransition.action === 'approve' ? 'proposal_approved'
        : 'proposal_forwarded'

      // Notify contractor
      const { data: contractorRaw } = await supabase
        .from('contractors').select('user_id').eq('id', proposal.contractor_id).single()
      const contractor = contractorRaw as unknown as { user_id: string } | null
      if (contractor) {
        await notify({
          userId: contractor.user_id,
          type: notifType,
          title: `Quotation ${selectedTransition.action === 'reject' ? 'Rejected' : selectedTransition.action === 'return' ? 'Returned' : 'Updated'}`,
          message: `Your quotation "${proposal.title}" has been ${selectedTransition.label.toLowerCase()}.`,
          referenceId: proposal.id,
          referenceType: 'proposal',
        })
      }

      // Notify next-stage staff on forward/approve
      if (selectedTransition.action === 'forward' || selectedTransition.action === 'approve') {
        const nextRole = selectedTransition.nextStatus === 'procurement_appraisal' ? 'head_of_procurement'
          : selectedTransition.nextStatus === 'md_final_review' ? 'md'
          : selectedTransition.nextStatus === 'ict_assignment' ? 'ict_admin'
          : null
        if (nextRole) {
          const staff = await getStaffByRole(nextRole)
          await notifyMany(staff.map(s => ({
            userId: s.id,
            type: 'proposal_forwarded',
            title: 'Quotation Requires Your Action',
            message: `Quotation "${proposal.title}" is now in ${selectedTransition.nextStage.replace(/_/g, ' ')} stage.`,
            referenceId: proposal.id,
            referenceType: 'proposal',
          })))
        }
      }

      toast.success(`Quotation ${selectedTransition.label.toLowerCase()} successfully`)
      setSelectedTransition(null)
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
          <Label className="text-sm font-medium text-slate-600">
            {proposal.status === 'procurement_appraisal' || proposal.status === 'procurement_review'
              ? 'Appraisal Notes *'
              : 'Add Comment / Minutes *'}
          </Label>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add your comments, observations, or minutes regarding this quotation..."
            className="min-h-[100px] bg-white resize-none text-base"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {transitions.map(t => {
            const Icon = t.icon
            return (
              <Button
                key={t.action}
                type="button"
                onClick={() => setSelectedTransition(t)}
                disabled={!comment.trim()}
                size="lg"
                className={`text-white h-11 ${t.color} disabled:opacity-40`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {t.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedTransition} onOpenChange={() => setSelectedTransition(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Action</DialogTitle>
            <DialogDescription className="text-base mt-2">
              You are about to: <strong>{selectedTransition?.label}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
            <strong>Your comment:</strong>
            <p className="mt-1 italic">&ldquo;{comment}&rdquo;</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setSelectedTransition(null)} className="flex-1 h-11" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAction}
              disabled={loading}
              className={`flex-1 h-11 text-white ${selectedTransition?.color}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
