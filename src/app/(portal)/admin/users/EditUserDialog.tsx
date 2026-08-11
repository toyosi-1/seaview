'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUser } from '@/app/actions/updateUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Pencil, Loader2, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_LABELS, STAFF_ROLES } from '@/lib/constants'
import type { Profile, UserRole } from '@/types/database'

interface EditUserDialogProps {
  user: Profile
  currentUserId: string
}

export function EditUserDialog({ user, currentUserId }: EditUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<UserRole>(user.role)
  const [isActive, setIsActive] = useState(user.is_active)

  const isSelf = user.id === currentUserId

  async function handleSave() {
    if (!email) {
      toast.error('Email is required')
      return
    }
    setLoading(true)
    try {
      const result = await updateUser({
        userId: user.id,
        fullName: fullName || null,
        email,
        role,
        isActive,
      })
      if (result.error) throw new Error(result.error)
      toast.success('User updated successfully')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-500 hover:text-blue-600 h-9 px-3"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Pencil className="w-4 h-4 mr-1" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              Edit User
            </DialogTitle>
            <DialogDescription>Update user details, role, or account status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Full Name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Email Address *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Role</Label>
                <Select value={role} onValueChange={v => setRole(v as UserRole)} disabled={isSelf}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && <p className="text-xs text-slate-400">You cannot change your own role</p>}
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-base font-medium">Account Status</Label>
                <Select value={isActive ? 'active' : 'inactive'} onValueChange={v => setIsActive(v === 'active')} disabled={isSelf}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive (Deactivated)</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && <p className="text-xs text-slate-400">You cannot deactivate your own account</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11" disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={loading || !email}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserCog className="w-5 h-5 mr-2" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
