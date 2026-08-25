import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, ArrowRight } from 'lucide-react'
import { INTERNAL_PROCUREMENT_STATUS_LABELS, INTERNAL_PROCUREMENT_STATUS_COLORS, DEPARTMENT_LABELS, STAFF_ROLES, ROLE_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { PaginationControls, PAGE_SIZE } from '@/components/ui/pagination-controls'
import type { Profile, InternalProcurementRequest, InternalProcurementStatus, UserRole } from '@/types/database'

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function InternalProcurementPage({ searchParams }: PageProps) {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile
  if (!STAFF_ROLES.includes(p.role)) redirect('/dashboard')

  const canReview = p.role === 'md' || p.role === 'head_of_procurement' || p.role === 'ict_admin'

  const sp = await searchParams
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count } = await supabase
    .from('internal_procurement_requests')
    .select('*,profiles!internal_procurement_requests_requested_by_fkey(full_name,role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  const requests = (data ?? []) as unknown as (InternalProcurementRequest & { profiles?: { full_name: string | null; role: UserRole } })[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Status summary counts across ALL requests (not just the current page)
  const { data: allStatusRows } = await supabase.from('internal_procurement_requests').select('status')
  const statusCounts = ((allStatusRows ?? []) as { status: string }[]).reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Internal Procurement</h1>
          <p className="text-slate-500 mt-1">
            {canReview ? 'All departmental procurement requests' : 'Your department procurement requests'}
          </p>
        </div>
        <Button asChild size="lg" className="bg-spl-blue hover:bg-spl-blue-dark text-white h-12 px-6 text-base font-semibold">
          <Link href="/internal-procurement/new">
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(INTERNAL_PROCUREMENT_STATUS_LABELS).map(([key, label]) => {
          const count = statusCounts[key] ?? 0
          if (count === 0) return null
          return (
            <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-medium ${INTERNAL_PROCUREMENT_STATUS_COLORS[key as InternalProcurementStatus]}`}>
              {label} <span className="font-bold">{count}</span>
            </span>
          )
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Requests ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingCart className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No procurement requests yet</p>
              <Button asChild className="mt-4 bg-spl-blue hover:bg-spl-blue-dark text-white">
                <Link href="/internal-procurement/new">Submit your first request</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(req => {
                const status = req.status as InternalProcurementStatus
                return (
                  <Link
                    key={req.id}
                    href={`/internal-procurement/${req.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-sm bg-spl-blue-light flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-spl-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{req.item_description}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {req.request_number} · {DEPARTMENT_LABELS[req.department]}
                        {req.profiles && ` · ${req.profiles.full_name ?? ROLE_LABELS[req.profiles.role]}`}
                        {' · '}{formatDate(req.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(req.estimated_cost)}
                      </p>
                      {req.clarification_requested ? (
                        <Badge className="bg-spl-warning-bg text-spl-warning">Clarification Needed</Badge>
                      ) : (
                        <Badge className={INTERNAL_PROCUREMENT_STATUS_COLORS[status]}>
                          {INTERNAL_PROCUREMENT_STATUS_LABELS[status]}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath="/internal-procurement" />
        </CardContent>
      </Card>
    </div>
  )
}
