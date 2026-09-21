import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus, ArrowRight } from 'lucide-react'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS, CONTRACTOR_PROPOSAL_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { PaginationControls, PAGE_SIZE } from '@/components/ui/pagination-controls'
import type { Profile, Proposal, ProposalStatus } from '@/types/database'

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function ProposalsPage({ searchParams }: PageProps) {
  const { supabase, user, profile, contractorId } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const sp = await searchParams
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let proposals: Proposal[] = []
  let totalCount = 0
  let statusCounts: Record<string, number> = {}

  if (p.role === 'contractor') {
    if (contractorId) {
      const { data, count } = await supabase
        .from('proposals')
        .select('*,contractors(company_name)', { count: 'exact' })
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false })
        .range(from, to)
      proposals = (data ?? []) as unknown as Proposal[]
      totalCount = count ?? 0
    }
  } else {
    const [{ data, count }, { data: allStatusRows }] = await Promise.all([
      supabase
        .from('proposals')
        .select('*,contractors(company_name)', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(from, to),
      // Status summary counts across ALL proposals (not just the current page)
      supabase.from('proposals').select('status'),
    ])
    proposals = (data ?? []) as unknown as Proposal[]
    totalCount = count ?? 0
    statusCounts = ((allStatusRows ?? []) as { status: string }[]).reduce((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quotations</h1>
          <p className="text-slate-500 mt-1">
            {p.role === 'contractor' ? 'Your submitted quotations' : 'All contractor quotations'}
          </p>
        </div>
        {p.role === 'contractor' && (
          <Button asChild size="lg" className="bg-spl-blue hover:bg-spl-blue-dark text-white h-12 px-6 text-base font-semibold">
            <Link href="/tenders">
              <Plus className="w-5 h-5 mr-2" />
              Browse Contracts
            </Link>
          </Button>
        )}
      </div>

      {/* Status Filter Summary */}
      {p.role !== 'contractor' && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROPOSAL_STATUS_LABELS).map(([key, label]) => {
            const count = statusCounts[key] ?? 0
            if (count === 0) return null
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-medium ${PROPOSAL_STATUS_COLORS[key as ProposalStatus]}`}>
                {label} <span className="font-bold">{count}</span>
              </span>
            )
          })}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Quotations ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No quotations yet</p>
              {p.role === 'contractor' && (
                <Button asChild className="mt-4 bg-spl-blue hover:bg-spl-blue-dark text-white">
                  <Link href="/tenders">Browse Available Contracts</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {proposals.map(proposal => {
                const status = proposal.status as ProposalStatus
                const contractor = (proposal as unknown as { contractors?: { company_name: string } }).contractors
                const statusLabel = p.role === 'contractor'
                  ? (CONTRACTOR_PROPOSAL_STATUS_LABELS[status] ?? PROPOSAL_STATUS_LABELS[status])
                  : PROPOSAL_STATUS_LABELS[status]
                return (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-sm bg-spl-blue-light flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-spl-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{proposal.title}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {proposal.proposal_number}
                        {contractor && ` · ${contractor.company_name}`}
                        {' · '}{formatDate(proposal.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(proposal.estimated_cost)}
                      </p>
                      <Badge className={PROPOSAL_STATUS_COLORS[status]}>
                        {statusLabel}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath="/proposals" />
        </CardContent>
      </Card>
    </div>
  )
}
