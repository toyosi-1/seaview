import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, ArrowRight, ClipboardList } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { PaginationControls, PAGE_SIZE } from '@/components/ui/pagination-controls'
import type { Profile, Contract } from '@/types/database'

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function ContractsPage({ searchParams }: PageProps) {
  const { supabase, profile, contractorId, contractorStatus } = await getSessionProfile()
  if (!profile) redirect('/login')
  const p = profile as Profile
  const isSuspended = p.role === 'contractor' && contractorStatus === 'suspended'

  const sp = await searchParams
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let contracts: Contract[] = []
  let totalCount = 0

  if (p.role === 'contractor') {
    if (contractorId) {
      const { data, count } = await supabase
        .from('contracts')
        .select('*,contractors(company_name),completion_reports(id)', { count: 'exact' })
        .eq('contractor_id', contractorId)
        .order('awarded_at', { ascending: false })
        .range(from, to)
      contracts = (data ?? []) as unknown as Contract[]
      totalCount = count ?? 0
    }
  } else {
    const { data, count } = await supabase
      .from('contracts')
      .select('*,contractors(company_name),completion_reports(id)', { count: 'exact' })
      .order('awarded_at', { ascending: false })
      .range(from, to)
    contracts = (data ?? []) as unknown as Contract[]
    totalCount = count ?? 0
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-spl-success-bg text-spl-success' :
    s === 'completed' ? 'bg-spl-blue-light text-spl-blue-dark' :
    'bg-spl-danger-bg text-spl-danger'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Contracts</h1>
        <p className="text-slate-500 mt-1">Awarded contracts</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">All Contracts ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No contracts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contracts.map(c => {
                const meta = c as unknown as { contractors?: { company_name: string }; completion_reports?: { id: string }[] }
                const contractor = meta.contractors
                const completionId = meta.completion_reports?.[0]?.id
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <Link href={`/contracts/${c.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-sm bg-spl-success-bg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-spl-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-base truncate">{c.title}</p>
                        <p className="text-sm text-slate-500 truncate">
                          {c.contract_number}
                          {contractor && ` · ${contractor.company_name}`}
                          {' · Awarded '}{formatDate(c.awarded_at)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(c.contract_value)}
                      </p>
                      {p.role === 'contractor' && c.status === 'active' && !isSuspended && (
                        <Link
                          href={completionId ? `/completions/${completionId}` : `/completions/new?contract_id=${c.id}`}
                          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-spl-blue hover:bg-spl-blue-dark text-white text-xs font-semibold transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          {completionId ? 'View Completion' : 'Submit Completion'}
                        </Link>
                      )}
                      <Link href={`/contracts/${c.id}`}>
                        <Badge className={statusColor(c.status)}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                      </Link>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath="/contracts" />
        </CardContent>
      </Card>
    </div>
  )
}
