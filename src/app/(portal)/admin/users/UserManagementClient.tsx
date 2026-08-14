'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStaffUser } from '@/app/actions/createUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_LABELS, STAFF_ROLES } from '@/lib/constants'
import type { UserRole } from '@/types/database'

export function UserManagementClient() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('head_of_procurement')
  const [tempPassword, setTempPassword] = useState('')

  async function handleCreate() {
    if (!email || !tempPassword) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const result = await createStaffUser({
        fullName: null,
        email,
        password: tempPassword,
        role,
      })

      if (result.error) throw new Error(result.error)

      toast.success(`${ROLE_LABELS[role]} account created. Temporary password: ${tempPassword}`)
      setOpen(false)
      setEmail(''); setTempPassword('')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} size="lg" className="bg-spl-blue hover:bg-spl-blue-dark text-white h-12 px-6 text-base font-semibold">
        <UserPlus className="w-5 h-5 mr-2" />
        Create User
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Email Address *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@seaview.com" className="h-11" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Role *</Label>
                <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Temporary Password *</Label>
                <Input type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="Min 8 characters" className="h-11 font-mono" />
                <p className="text-xs text-slate-500">Share this password securely with the new user. They should change it on first login.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11" disabled={loading}>Cancel</Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={loading || !email || !tempPassword}
                className="flex-1 h-11 bg-spl-blue hover:bg-spl-blue-dark text-white"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
