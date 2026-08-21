'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUser, deleteUser } from '@/app/actions/updateUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Pencil, Loader2, UserCog, Trash2 } from 'lucide-react'
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
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<UserRole>(user.role)
  const [isActive, setIsActive] = useState(user.is_active)

  const isSelf = user.id === currentUserId
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleSave() {
    if (!email) {
      toast.error('Email is required')
      return
    }
    setLoading(true)
    try {
      const result = await updateUser({
        userId: user.id,
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
        className="text-slate-500 hover:text-spl-blue h-9 px-3"
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
              <UserCog className="w-5 h-5 text-spl-blue" />
              Edit User
            </DialogTitle>
            <DialogDescription>Update user details, role, or account status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                className="flex-1 h-11 bg-spl-blue hover:bg-spl-blue-dark text-white"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserCog className="w-5 h-5 mr-2" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        className="text-spl-danger hover:text-red-700 hover:bg-red-50 h-9 px-3"
        type="button"
        onClick={() => setDeleteOpen(true)}
        disabled={isSelf}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-spl-danger">Delete User</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to delete <strong>{user.full_name ?? user.email}</strong>? This will permanently remove their account and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1 h-11" disabled={deleteLoading}>Cancel</Button>
            <Button
              type="button"
              onClick={async () => {
                setDeleteLoading(true)
                try {
                  const result = await deleteUser(user.id)
                  if (result.error) throw new Error(result.error)
                  toast.success('User deleted successfully')
                  setDeleteOpen(false)
                  router.refresh()
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : 'Failed to delete user')
                } finally {
                  setDeleteLoading(false)
                }
              }}
              disabled={deleteLoading}
              className="flex-1 h-11 bg-spl-danger hover:bg-spl-danger-dark text-white"
            >
              {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
