'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CompletionPeriodEditorProps {
  contractId: string
  completionPeriod: string | null
  editable: boolean
}

export function CompletionPeriodEditor({ contractId, completionPeriod, editable }: CompletionPeriodEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(completionPeriod ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('contracts')
      .update({ completion_period: value.trim() || null } as never)
      .eq('id', contractId)
    setLoading(false)
    if (error) {
      toast.error('Failed to update completion period')
      return
    }
    toast.success('Completion period updated')
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder='e.g. "One (1) week"'
          className="h-9 text-sm max-w-[220px]"
          autoFocus
        />
        <Button type="button" size="sm" className="h-9 px-2" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-9 px-2" onClick={() => { setEditing(false); setValue(completionPeriod ?? '') }} disabled={loading}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <p className="font-semibold text-slate-800 mt-0.5">{completionPeriod || '—'}</p>
      {editable && (
        <button type="button" onClick={() => setEditing(true)} className="text-slate-400 hover:text-spl-blue">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
