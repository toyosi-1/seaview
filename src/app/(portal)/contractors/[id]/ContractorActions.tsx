'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckCircle, Ban, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { Contractor, UserRole } from '@/types/database'
import { notify, logAudit } from '@/lib/utils/notify'

interface ContractorActionsProps {
  contractor: Contractor
  currentRole: UserRole
}

export function ContractorActions({ contractor, currentRole }: ContractorActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<'active' | 'suspended' | null>(null)
  const [loading, setLoading] = useState(false)

  if (!['md', 'ict_admin', 'head_of_procurement'].includes(currentRole)) return null

  async function handleAction() {
    if (!action) return
    setLoading(true)
    const supabase = createClient()

    const update: Record<string, unknown> = { status: action }
    if (action === 'active') {
      update.verified_at = new Date().toISOString()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) update.verified_by = currentUser.id
    }

    const { error } = await supabase
      .from('contractors')
      .update(update as never)
      .eq('id', contractor.id)
    if (error) {
      toast.error('Failed to update contractor status')
    } else {
      // Audit log
      await logAudit({
        userId: contractor.user_id,
        userRole: currentRole,
        action: action === 'active' ? 'Contractor activated' : 'Contractor suspended',
        entityType: 'contractor',
        entityId: contractor.id,
        previousStatus: contractor.status,
        newStatus: action,
      })

      // Notify contractor
      await notify({
        userId: contractor.user_id,
        type: action === 'active' ? 'proposal_approved' : 'proposal_rejected',
        title: action === 'active' ? 'Account Activated' : 'Account Suspended',
        message: action === 'active'
          ? 'Your contractor account has been activated. You can now submit proposals.'
          : 'Your contractor account has been suspended. Please contact administration.',
        referenceId: contractor.id,
        referenceType: 'contractor',
      })

      toast.success(`Contractor ${action === 'active' ? 'activated' : 'suspended'} successfully`)
      router.refresh()
    }
    setLoading(false)
    setOpen(false)
  }

  return (
    <>
      <div className="flex gap-2">
        {contractor.status === 'pending' && (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white h-11"
            type="button"
            onClick={() => { setAction('active'); setOpen(true) }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Verify & Approve
          </Button>
        )}
        {contractor.status === 'suspended' && (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white h-11"
            type="button"
            onClick={() => { setAction('active'); setOpen(true) }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reactivate
          </Button>
        )}
        {contractor.status === 'active' && (
          <Button
            size="lg"
            variant="destructive"
            className="h-11"
            type="button"
            onClick={() => { setAction('suspended'); setOpen(true) }}
          >
            <Ban className="w-4 h-4 mr-2" />
            Suspend
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Action</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to{' '}
              {contractor.status === 'pending' && action === 'active'
                ? <strong>verify and approve</strong>
                : action === 'active'
                  ? <strong>reactivate</strong>
                  : <strong>suspend</strong>}{' '}
              <strong>{contractor.company_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAction}
              disabled={loading}
              className={`flex-1 h-11 text-white ${action === 'active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
