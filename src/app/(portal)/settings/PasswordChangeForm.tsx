'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock, Check, Loader2 } from 'lucide-react'

export function PasswordChangeForm() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPass.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPass !== confirm) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Not authenticated')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      })
      if (signInError) throw new Error('Current password is incorrect')

      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) throw error

      setDone(true)
      setCurrent(''); setNewPass(''); setConfirm('')
      toast.success('Password updated successfully')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {done && (
        <div className="mb-4 flex items-center gap-2 bg-spl-success-bg border border-green-200 text-spl-success rounded-lg px-4 py-3 text-sm font-medium">
          <Check className="w-4 h-4" /> Password changed successfully
        </div>
      )}

      <form onSubmit={handleChange} className="space-y-4">
        <div className="space-y-2">
          <Label className="font-medium">Current Password</Label>
          <Input
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder="Enter current password"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="font-medium">New Password</Label>
          <Input
            type="password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Minimum 8 characters"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="font-medium">Confirm New Password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            className="h-11"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !current || !newPass || !confirm}
          className="w-full h-11 bg-spl-blue hover:bg-spl-blue-dark text-white font-semibold"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating...</>
            : <><Lock className="w-4 h-4 mr-2" />Update Password</>}
        </Button>
      </form>
    </>
  )
}
