import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Notification } from '@/types/database'

const TYPE_COLORS: Record<string, string> = {
  proposal_submitted: 'bg-spl-blue-light text-spl-blue-dark',
  proposal_approved: 'bg-spl-success-bg text-spl-success',
  proposal_rejected: 'bg-spl-danger-bg text-spl-danger',
  proposal_returned: 'bg-spl-warning-bg text-spl-warning',
  contract_awarded: 'bg-purple-100 text-purple-800',
  payment_completed: 'bg-emerald-100 text-emerald-800',
  default: 'bg-slate-100 text-slate-800',
}

export default async function NotificationsPage() {
  const { supabase, user } = await getSessionProfile()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Mark all as read
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
        <p className="text-slate-500 mt-1">Your activity feed</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Notifications ({notifications?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!notifications?.length ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(notifications as Notification[]).map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-4 px-5 py-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className={`w-2 h-2 rounded-sm mt-2.5 flex-shrink-0 ${!n.is_read ? 'bg-spl-blue-light' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-base">{n.title}</p>
                      <Badge className={TYPE_COLORS[n.type] ?? TYPE_COLORS.default}>
                        {n.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
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
