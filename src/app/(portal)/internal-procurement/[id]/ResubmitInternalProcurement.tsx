'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { InternalProcurementRequest, Profile } from '@/types/database'
import { notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'
import { capitalizeFirst } from '@/lib/utils/format'
import { reviewerRoleForStatus } from './InternalProcurementActions'

interface ResubmitInternalProcurementProps {
  request: InternalProcurementRequest
  profile: Profile
}

export function ResubmitInternalProcurement({ request, profile }: ResubmitInternalProcurementProps) {
  const router = useRouter()
  const [itemDescription, setItemDescription] = useState(request.item_description)
  const [quantity, setQuantity] = useState(String(request.quantity))
  const [estimatedCost, setEstimatedCost] = useState(String(request.estimated_cost))
  const [reason, setReason] = useState(request.reason)
  const [loading, setLoading] = useState(false)

  async function handleResubmit() {
    const qty = Number(quantity)
    const cost = Number(estimatedCost)
    if (!itemDescription.trim() || !reason.trim()) {
      toast.error('Item description and justification are required')
      return
    }
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error('Quantity must be at least 1')
      return
    }
    if (!Number.isFinite(cost) || cost < 0) {
      toast.error('Estimated cost must be a non-negative number')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('internal_procurement_requests')
        .update({
          item_description: capitalizeFirst(itemDescription),
          quantity: qty,
          estimated_cost: cost,
          reason: capitalizeFirst(reason),
          clarification_requested: false,
          clarification_reason: null,
        } as Partial<InternalProcurementRequest>)
        .eq('id', request.id)
      if (error) throw error

      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: 'Resubmitted After Clarification',
        entityType: 'internal_procurement_request',
        entityId: request.id,
        previousStatus: request.status,
        newStatus: request.status,
      })

      const reviewerRole = reviewerRoleForStatus(request.status)
      if (reviewerRole) {
        const staff = await getStaffByRole(reviewerRole)
        await notifyMany(staff.map(s => ({
          userId: s.id,
          type: 'proposal_forwarded',
          title: 'Procurement Request Resubmitted',
          message: `Request "${capitalizeFirst(itemDescription)}" was resubmitted after clarification and requires your review.`,
          referenceId: request.id,
          referenceType: 'internal_procurement',
        })))
      }

      toast.success('Request resubmitted successfully')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resubmit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 bg-slate-50 rounded-2xl space-y-4 border border-slate-200">
      <h3 className="font-bold text-slate-800 text-base">Resubmit Procurement Request</h3>
      <p className="text-sm text-slate-500">
        Update the details below based on the reviewer&apos;s note above, then resubmit for review.
      </p>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-600">Item / Service Description *</Label>
        <Textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} className="min-h-[90px] bg-white resize-none text-base" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">Quantity *</Label>
          <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="h-11 bg-white text-base" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">Estimated Cost (₦) *</Label>
          <Input type="number" min={0} step="0.01" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} className="h-11 bg-white text-base" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-600">Justification / Reason *</Label>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} className="min-h-[90px] bg-white resize-none text-base" />
      </div>
      <Button
        type="button"
        onClick={handleResubmit}
        disabled={loading}
        size="lg"
        className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
        Resubmit for Review
      </Button>
    </div>
  )
}
