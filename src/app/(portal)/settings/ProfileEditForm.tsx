'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import type { Profile } from '@/types/database'
import { ROLE_LABELS } from '@/lib/constants'

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const isStaff = profile.role !== 'contractor'
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const update: Record<string, unknown> = { phone: phone.trim() || null }
      if (!isStaff) update.full_name = fullName.trim() || null
      const { error } = await supabase.from('profiles').update(update as Partial<Profile>).eq('id', profile.id)
      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {isStaff ? (
        <div className="space-y-2">
          <Label className="font-medium">Role</Label>
          <Input
            value={ROLE_LABELS[profile.role]}
            disabled
            className="h-11 bg-slate-50 text-slate-500"
          />
          <p className="text-xs text-slate-400">Staff are identified by role, not personal name.</p>
        </div>
      ) : (
      <div className="space-y-2">
        <Label className="font-medium">Full Name</Label>
        <Input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="h-11"
        />
      </div>
      )}
      <div className="space-y-2">
        <Label className="font-medium">Email Address</Label>
        <Input
          value={profile.email}
          disabled
          className="h-11 bg-slate-50 text-slate-500"
        />
        <p className="text-xs text-slate-400">Email cannot be changed. Contact ICT Admin.</p>
      </div>
      <div className="space-y-2">
        <Label className="font-medium">Phone Number</Label>
        <Input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+234 800 000 0000"
          className="h-11"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-spl-blue hover:bg-spl-blue-dark text-white font-semibold"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
          : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
      </Button>
    </form>
  )
}
