import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserManagementClient } from './UserManagementClient'
import { EditUserDialog } from './EditUserDialog'
import { Users } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import type { Profile, UserRole } from '@/types/database'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || (profile as Profile).role !== 'ict_admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">Create and manage system users</p>
        </div>
        <UserManagementClient />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!users?.length ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(users as Profile[]).map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                    {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-base truncate">{u.full_name ?? ROLE_LABELS[u.role as UserRole]}</p>
                    <p className="text-sm text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm text-slate-400 hidden md:block">{formatDate(u.created_at)}</p>
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[u.role as UserRole]}
                    </Badge>
                    <Badge className={u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <EditUserDialog user={u} currentUserId={user.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
