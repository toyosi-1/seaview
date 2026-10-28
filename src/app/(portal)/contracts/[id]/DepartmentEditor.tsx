'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DEPARTMENTS, DEPARTMENT_LABELS, DEPARTMENT_HEAD_ROLE, ROLE_LABELS } from '@/lib/constants'
import type { Department } from '@/types/database'

interface DepartmentEditorProps {
  contractId: string
  department: Department | null
  editable: boolean
}

export function DepartmentEditor({ contractId, department, editable }: DepartmentEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<Department | ''>(department ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!value || value === department) {
      setEditing(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

      // Keep the project supervisor in sync with the corrected department
      const supervisorRole = DEPARTMENT_HEAD_ROLE[value]
      const { data: supervisorRaw } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', supervisorRole)
        .eq('is_active', true)
        .maybeSingle()
      const supervisor = supervisorRaw as unknown as { id: string } | null
      if (!supervisor) throw new Error(`No active ${ROLE_LABELS[supervisorRole]} found. Create one in User Management before assigning this department.`)

      const { error } = await supabase
        .from('contracts')
        .update({ responsible_department: value, project_supervisor_id: supervisor.id })
        .eq('id', contractId)
      if (error) throw error

      toast.success('Responsible department updated')
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update department')
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={v => setValue(v as Department)}>
          <SelectTrigger className="h-9 text-sm max-w-[200px]">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map(d => (
              <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" className="h-9 px-2" onClick={handleSave} disabled={loading || !value}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-9 px-2" onClick={() => { setEditing(false); setValue(department ?? '') }} disabled={loading}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <p className="font-semibold text-slate-800 mt-0.5">{department ? DEPARTMENT_LABELS[department] : '—'}</p>
      {editable && (
        <button type="button" onClick={() => setEditing(true)} aria-label="Edit responsible department" className="text-slate-400 hover:text-spl-blue">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
