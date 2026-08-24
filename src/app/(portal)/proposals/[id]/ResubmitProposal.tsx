'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Proposal, Profile } from '@/types/database'
import { notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'
import { PROPOSAL_STATUS_LABELS } from '@/lib/constants'

interface ResubmitProposalProps {
  proposal: Proposal
  profile: Profile
}

export function ResubmitProposal({ proposal, profile }: ResubmitProposalProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleResubmit() {
    if (!comment.trim()) {
      toast.error('Please add a note describing what was addressed')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const resumeStage = proposal.current_stage as Proposal['status']

      const { error: updateError } = await supabase
        .from('proposals')
        .update({ status: resumeStage, return_reason: null } as Partial<Proposal>)
        .eq('id', proposal.id)
      if (updateError) throw updateError

      await supabase.from('proposal_timeline').insert({
        proposal_id: proposal.id,
        actor_id: profile.id,
        stage: resumeStage,
        action: 'Resubmitted for Review',
        note: comment.trim(),
      })

      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: 'Resubmitted for Review',
        entityType: 'proposal',
        entityId: proposal.id,
        previousStatus: 'returned',
        newStatus: resumeStage,
      })

      const nextRole = resumeStage === 'md_review' ? 'md'
        : resumeStage === 'procurement_appraisal' ? 'head_of_procurement'
        : resumeStage === 'md_final_review' ? 'md'
        : null
      if (nextRole) {
        const staff = await getStaffByRole(nextRole)
        await notifyMany(staff.map(s => ({
          userId: s.id,
          type: 'proposal_forwarded',
          title: 'Quotation Resubmitted',
          message: `Quotation "${proposal.title}" was resubmitted and is back in the ${PROPOSAL_STATUS_LABELS[resumeStage]} stage.`,
          referenceId: proposal.id,
          referenceType: 'proposal',
        })))
      }

      toast.success('Quotation resubmitted successfully')
      setComment('')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resubmit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 bg-slate-50 rounded-2xl space-y-4 border border-slate-200">
      <h3 className="font-bold text-slate-800 text-base">Resubmit Quotation</h3>
      <p className="text-sm text-slate-500">
        Describe what was addressed based on the clarification requested, then resubmit for review.
      </p>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-600">Response / Clarification *</Label>
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Explain the changes or clarification provided..."
          className="min-h-[90px] bg-white resize-none text-base"
        />
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
