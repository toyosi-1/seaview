'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Contract, Profile } from '@/types/database'
import { notify, logAudit } from '@/lib/utils/notify'

interface TerminateContractProps {
  contract: Contract
  profile: Profile
}

export function TerminateContract({ contract, profile }: TerminateContractProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (contract.status !== 'active') return null
  if (!['md', 'ict_admin'].includes(profile.role)) return null

  async function handleTerminate() {
    if (!reason.trim()) {
      toast.error('Please provide a reason for termination')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('contracts')
        .update({ status: 'terminated' } as never)
        .eq('id', contract.id)
      if (error) throw error

      // Audit log
      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: 'Contract terminated',
        entityType: 'contract',
        entityId: contract.id,
        previousStatus: 'active',
        newStatus: 'terminated',
      })

      // Notify contractor
      const { data: contractorRaw } = await supabase
        .from('contractors').select('user_id').eq('id', contract.contractor_id).single()
      const contractor = contractorRaw as unknown as { user_id: string } | null
      if (contractor) {
        await notify({
          userId: contractor.user_id,
          type: 'proposal_rejected',
          title: 'Contract Terminated',
          message: `Your contract "${contract.title}" has been terminated. Reason: ${reason.trim()}`,
          referenceId: contract.id,
          referenceType: 'contract',
        })
      }

      toast.success('Contract terminated successfully')
      setOpen(false)
      setReason('')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to terminate contract')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="h-10"
        type="button"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Terminate Contract
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Terminate Contract
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              You are about to terminate <strong>{contract.title}</strong>
              ({contract.contract_number}). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600">Reason for Termination *</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Provide a detailed reason for terminating this contract..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11" disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleTerminate}
                disabled={loading || !reason.trim()}
                variant="destructive"
                className="flex-1 h-11"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Processing...' : 'Terminate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
