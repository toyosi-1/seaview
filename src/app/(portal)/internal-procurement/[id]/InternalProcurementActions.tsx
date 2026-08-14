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
import type { InternalProcurementRequest, Profile, InternalProcurementStatus } from '@/types/database'
import { notify, notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'

interface Action {
  label: string
  nextStatus: InternalProcurementStatus
  color: string
  icon: React.ElementType
}

function getActions(status: InternalProcurementStatus, role: string): Action[] {
  if (status === 'submitted' && role === 'md') return [
    { label: 'Approve & Forward to Procurement', nextStatus: 'procurement_review', color: 'bg-spl-blue hover:bg-spl-blue-dark', icon: ArrowRight },
    { label: 'Reject', nextStatus: 'rejected', color: 'bg-spl-danger hover:bg-spl-danger-dark', icon: XCircle },
  ]
  if (status === 'procurement_review' && role === 'head_of_procurement') return [
    { label: 'Approve Purchase', nextStatus: 'approved', color: 'bg-spl-success hover:bg-spl-success-dark', icon: CheckCircle },
    { label: 'Reject', nextStatus: 'rejected', color: 'bg-spl-danger hover:bg-spl-danger-dark', icon: XCircle },
  ]
  return []
}

export function InternalProcurementActions({ request, profile }: { request: InternalProcurementRequest; profile: Profile }) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [selected, setSelected] = useState<Action | null>(null)
  const [loading, setLoading] = useState(false)

  const actions = getActions(request.status, profile.role)
  if (actions.length === 0) return null

  async function handleAction() {
    if (!selected) return
    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const update: Record<string, unknown> = { status: selected.nextStatus }

      if (request.status === 'submitted') {
        update.md_reviewed_at = now
        update.md_reviewed_by = profile.id
        if (selected.nextStatus === 'rejected') update.rejection_reason = comment
      } else if (request.status === 'procurement_review') {
        update.procurement_reviewed_at = now
        update.procurement_reviewed_by = profile.id
        if (selected.nextStatus === 'rejected') update.rejection_reason = comment
      }

      const { error } = await supabase
        .from('internal_procurement_requests')
        .update(update as never)
        .eq('id', request.id)
      if (error) throw error

      // Audit log
      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: selected.label,
        entityType: 'internal_procurement_request',
        entityId: request.id,
        previousStatus: request.status,
        newStatus: selected.nextStatus,
      })

      // Notify requester
      await notify({
        userId: request.requested_by,
        type: selected.nextStatus === 'rejected' ? 'proposal_rejected' : 'proposal_approved',
        title: selected.nextStatus === 'rejected' ? 'Procurement Request Rejected' : 'Procurement Request Updated',
        message: `Your request "${request.item_description}" has been ${selected.label.toLowerCase()}.`,
        referenceId: request.id,
        referenceType: 'internal_procurement',
      })

      // Notify next-stage staff on forward/approve
      if (selected.nextStatus === 'procurement_review') {
        const staff = await getStaffByRole('head_of_procurement')
        await notifyMany(staff.map(s => ({
          userId: s.id,
          type: 'proposal_forwarded',
          title: 'Procurement Request Requires Your Action',
          message: `Request "${request.item_description}" is now in procurement review.`,
          referenceId: request.id,
          referenceType: 'internal_procurement',
        })))
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
          <Label className="text-sm font-medium text-slate-600">Comment {selected?.nextStatus === 'rejected' ? '*' : '(optional)'}</Label>
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add your review comments..." className="min-h-[90px] bg-white resize-none text-base" />
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(a => {
            const Icon = a.icon
            const disabled = a.nextStatus === 'rejected' && !comment.trim()
            return (
              <Button key={a.label} type="button" onClick={() => setSelected(a)} disabled={disabled} size="lg" className={`text-white h-11 ${a.color} disabled:opacity-40`}>
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
          {comment && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
              <strong>Comment:</strong><p className="mt-1 italic">&ldquo;{comment}&rdquo;</p>
            </div>
          )}
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
