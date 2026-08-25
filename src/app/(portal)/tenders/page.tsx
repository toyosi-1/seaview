import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Plus, ArrowRight, CalendarDays } from 'lucide-react'
import { TENDER_STATUS_LABELS, TENDER_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import { PaginationControls, PAGE_SIZE } from '@/components/ui/pagination-controls'
import type { Profile, Tender, TenderStatus } from '@/types/database'

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function TendersPage({ searchParams }: PageProps) {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const isContractor = p.role === 'contractor'
  const isContractOfficer = p.role === 'contract_officer'

  const sp = await searchParams
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('tenders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (isContractor) {
    query = query.eq('status', 'open')
  }

  const { data: tendersRaw, count } = await query
  const tenders = (tendersRaw ?? []) as unknown as Tender[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Status summary counts across ALL tenders (not just the current page)
  let statusCounts: Record<string, number> = {}
  if (!isContractor) {
    const { data: allStatuses } = await supabase.from('tenders').select('status')
    statusCounts = ((allStatuses ?? []) as { status: string }[]).reduce((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Available Contracts</h1>
          <p className="text-slate-500 mt-1">
            {isContractor
              ? 'Browse available contracts and submit your quotation'
              : isContractOfficer
                ? 'Manage posted contracts and tenders'
                : 'All posted contracts and tenders'}
          </p>
        </div>
        {isContractOfficer && (
          <Button asChild size="lg" className="bg-spl-blue hover:bg-spl-blue-dark text-white h-12 px-6 text-base font-semibold">
            <Link href="/tenders/new">
              <Plus className="w-5 h-5 mr-2" />
              Post New Contract
            </Link>
          </Button>
        )}
      </div>

      {/* Status Filter Summary */}
      {!isContractor && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(TENDER_STATUS_LABELS).map(([key, label]) => {
            const count = statusCounts[key] ?? 0
            if (count === 0) return null
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-medium ${TENDER_STATUS_COLORS[key as TenderStatus]}`}>
                {label} <span className="font-bold">{count}</span>
              </span>
            )
          })}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Contracts ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No contracts available</p>
              {isContractOfficer && (
                <Button asChild className="mt-4 bg-spl-blue hover:bg-spl-blue-dark text-white">
                  <Link href="/tenders/new">Post your first contract</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tenders.map(tender => {
                const status = tender.status as TenderStatus
                return (
                  <Link
                    key={tender.id}
                    href={`/tenders/${tender.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-sm bg-spl-blue-light flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-spl-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{tender.title}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {tender.contract_number}
                        {tender.closing_date && (
                          <> · <CalendarDays className="w-3.5 h-3.5 inline -mt-0.5" /> Closes {formatDate(tender.closing_date)}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={TENDER_STATUS_COLORS[status]}>
                        {TENDER_STATUS_LABELS[status]}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath="/tenders" />
        </CardContent>
      </Card>
    </div>
  )
}
