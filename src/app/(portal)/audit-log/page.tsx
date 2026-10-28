import { Suspense } from 'react'
import { getSessionProfile } from '@/lib/supabase/session'
import { PaginationControls, PAGE_SIZE } from '@/components/ui/pagination-controls'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollText } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils/format'
import type { Profile, AuditLog, UserRole } from '@/types/database'

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function AuditLogPage({ searchParams }: PageProps) {
  const { user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  if (!['md', 'ict_admin'].includes(p.role)) redirect('/dashboard')

  const { page } = await searchParams
  const requestedPage = Number(page ?? 1)
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Audit Log</h1>
        <p className="text-slate-500 mt-1">Complete immutable record of all system actions</p>
      </div>

      <Suspense key={currentPage} fallback={<AuditLogLoading />}>
        <AuditLogEntries currentPage={currentPage} />
      </Suspense>
    </div>
  )
}

function AuditLogLoading() {
  return (
    <Card className="border-0 shadow-sm" role="status" aria-label="Loading audit entries">
      <CardContent className="space-y-3 animate-pulse motion-reduce:animate-none">
        <span className="sr-only">Loading audit entries…</span>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} aria-hidden="true" className="h-20 rounded-xl bg-slate-100" />
        ))}
      </CardContent>
    </Card>
  )
}

async function AuditLogEntries({ currentPage }: { currentPage: number }) {
  const { supabase } = await getSessionProfile()
  const from = (currentPage - 1) * PAGE_SIZE
  const { data: logs, count, error } = await supabase
    .from('audit_logs')
    .select('id,action,user_role,entity_type,previous_status,new_status,created_at,profiles(full_name,email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) throw new Error('Unable to load the audit log. Please try again.')
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  if (currentPage > totalPages) redirect(`/audit-log?page=${totalPages}`)

  return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Activity Log ({count ?? 0} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <div className="text-center py-16 text-slate-400">
              <ScrollText className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No audit entries yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(logs as AuditLog[]).map(log => {
                const actor = (log as unknown as { profiles?: { full_name: string; email: string } }).profiles
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-5 py-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <p className="font-semibold text-slate-800 text-sm">{log.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {actor?.full_name ?? (log.user_role ? ROLE_LABELS[log.user_role as UserRole] ?? log.user_role : 'System')} · {actor?.email ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Entity</p>
                        <p className="text-sm font-medium text-slate-700 capitalize mt-0.5">
                          {log.entity_type.replace(/_/g, ' ')}
                        </p>
                        {log.previous_status && log.new_status && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {log.previous_status} → {log.new_status}
                          </p>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {log.user_role && (
                            <Badge variant="outline" className="text-xs">
                              {ROLE_LABELS[log.user_role as UserRole] ?? log.user_role}
                            </Badge>
                          )}
                          <p className="text-xs text-slate-400 mt-1">{formatDateTime(log.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath="/audit-log" />
        </CardContent>
      </Card>
  )
}
