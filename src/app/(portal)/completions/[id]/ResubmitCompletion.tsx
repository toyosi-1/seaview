'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CompletionReport, Profile } from '@/types/database'
import { notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'
import { reviewerRoleForStatus } from './CompletionActions'

interface ResubmitCompletionProps {
  completion: CompletionReport
  profile: Profile
  projectSupervisorId?: string | null
}

export function ResubmitCompletion({ completion, profile, projectSupervisorId }: ResubmitCompletionProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleResubmit() {
    if (!comment.trim()) {
      toast.error('Please add a note describing what was corrected')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('completion_reports')
        .update({ correction_requested: false, correction_reason: null } as Partial<CompletionReport>)
        .eq('id', completion.id)
      if (error) throw error

      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: 'Resubmitted After Correction',
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
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resubmit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 bg-slate-50 rounded-2xl space-y-4 border border-slate-200">
      <h3 className="font-bold text-slate-800 text-base">Resubmit Completion Report</h3>
      <p className="text-sm text-slate-500">
        Describe what was corrected based on the reviewer&apos;s note above, then resubmit for review.
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
