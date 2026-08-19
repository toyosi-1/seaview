'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { DEPARTMENTS, DEPARTMENT_LABELS, DEPARTMENT_HEAD_ROLE, ROLE_LABELS } from '@/lib/constants'
import type { Department, Profile, Proposal } from '@/types/database'
import { notify, logAudit } from '@/lib/utils/notify'

interface ICTAssignmentPanelProps {
  proposal: Proposal
  profile: Profile
}

export function ICTAssignmentPanel({ proposal, profile }: ICTAssignmentPanelProps) {
  const router = useRouter()
  const [department, setDepartment] = useState<Department | ''>('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (profile.role !== 'ict_admin') return null

  async function handleAssign() {
    if (!department) return
    setLoading(true)
    try {
      const supabase = createClient()

      const supervisorRole = DEPARTMENT_HEAD_ROLE[department as Department]
      const { data: supervisorRaw } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', supervisorRole)
        .eq('is_active', true)
        .limit(1)
        .single()
      const supervisor = supervisorRaw as unknown as { id: string } | null
      if (!supervisor) throw new Error(`No active ${ROLE_LABELS[supervisorRole]} found. Please create one in User Management before assigning this department.`)

      const { data: contractRaw } = await supabase
        .from('contracts')
        .select('id')
        .eq('proposal_id', proposal.id)
        .single()
      const contract = contractRaw as unknown as { id: string } | null
      if (!contract) throw new Error('Contract not found for this quotation')

      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          responsible_department: department,
          project_supervisor_id: supervisor?.id ?? null,
          department_assigned_at: new Date().toISOString(),
          department_assigned_by: profile.id,
        } as never)
        .eq('id', contract.id)
      if (contractError) throw contractError

      const { error: proposalError } = await supabase
        .from('proposals')
        .update({ status: 'approved', current_stage: 'approved' } as never)
        .eq('id', proposal.id)
      if (proposalError) throw proposalError

      // Mark the tender as awarded so it leaves the available contracts list
      if (proposal.tender_id) {
        await supabase
          .from('tenders')
          .update({ status: 'awarded' } as never)
          .eq('id', proposal.tender_id)
      }

      await supabase.from('proposal_timeline').insert({
        proposal_id: proposal.id,
        actor_id: profile.id,
        stage: 'approved',
        action: `Assigned to ${DEPARTMENT_LABELS[department as Department]} Department`,
        note: `Project Supervisor: ${supervisorRole ? supervisorRole : 'N/A'}`,
      } as never)

      // Audit log
      await logAudit({
        userId: profile.id,
        userRole: profile.role,
        action: `Assigned to ${DEPARTMENT_LABELS[department as Department]} Department`,
        entityType: 'proposal',
        entityId: proposal.id,
        previousStatus: 'ict_assignment',
        newStatus: 'approved',
      })

      // Notify contractor of approval
      const { data: contractorRaw } = await supabase
        .from('contractors').select('user_id').eq('id', proposal.contractor_id).single()
      const contractor = contractorRaw as unknown as { user_id: string } | null
      if (contractor) {
        await notify({
          userId: contractor.user_id,
          type: 'contract_awarded',
          title: 'Contract Awarded',
          message: `Your quotation "${proposal.title}" has been approved and a contract has been awarded.`,
          referenceId: proposal.id,
          referenceType: 'proposal',
        })
      }

      // Notify project supervisor
      if (supervisor) {
        await notify({
          userId: supervisor.id,
          type: 'contract_awarded',
          title: 'New Project Assigned',
          message: `You have been assigned as Project Supervisor for "${proposal.title}".`,
          referenceId: contract.id,
          referenceType: 'contract',
        })
      }

      toast.success('Department assigned. Award letter is now available.')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-5 bg-cyan-50 rounded-2xl space-y-4 border border-cyan-100">
        <h3 className="font-bold text-cyan-800 text-base flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Assign Responsible Department
        </h3>
        <p className="text-sm text-cyan-700">
          Assign the department that will supervise this project. The department head becomes the
          Project Supervisor and will review the contractor&apos;s completion report.
        </p>
        <div className="space-y-2 max-w-xs">
          <Label className="text-sm font-medium text-slate-600">Department</Label>
          <Select value={department} onValueChange={v => setDepartment(v as Department)}>
            <SelectTrigger className="h-11 bg-white">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map(d => (
                <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!department}
          className="bg-cyan-600 hover:bg-cyan-700 text-white h-11"
        >
          Assign Department
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Department Assignment</DialogTitle>
            <DialogDescription className="text-base mt-2">
              This contract will be assigned to <strong>{department && DEPARTMENT_LABELS[department as Department]}</strong>.
              The award letter will become available for download and the department head will be
              set as Project Supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={loading}
              className="flex-1 h-11 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Assigning...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
