import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, ArrowRight } from 'lucide-react'
import { COMPLETION_STATUS_LABELS, CONTRACTOR_COMPLETION_STATUS_LABELS, COMPLETION_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import { PaginationControls, PAGE_SIZE } from '@/components/ui/pagination-controls'
import type { Profile, CompletionReport, CompletionStatus } from '@/types/database'

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function CompletionsPage({ searchParams }: PageProps) {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const sp = await searchParams
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let completions: CompletionReport[] = []
  let totalCount = 0

  if (p.role === 'contractor') {
    const { data: contractorRaw } = await supabase.from('contractors').select('id').eq('user_id', user.id).maybeSingle()
    const contractor = contractorRaw as unknown as { id: string } | null
    if (contractor) {
      const { data, count } = await supabase
        .from('completion_reports')
        .select('*,contracts(contract_number)', { count: 'exact' })
        .eq('contractor_id', contractor.id)
        .order('submitted_at', { ascending: false })
        .range(from, to)
      completions = (data ?? []) as unknown as CompletionReport[]
      totalCount = count ?? 0
    }
  } else {
    const { data, count } = await supabase
      .from('completion_reports')
      .select('*,contracts(contract_number),contractors(company_name)', { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(from, to)
    completions = (data ?? []) as unknown as CompletionReport[]
    totalCount = count ?? 0
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Project Completions</h1>
        <p className="text-slate-500 mt-1">Project completion reports and verification</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">All Completion Reports ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {completions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No completion reports yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completions.map(cr => {
                const status = cr.status as CompletionStatus
                const meta = cr as unknown as { contracts?: { contract_number: string }; contractors?: { company_name: string } }
                return (
                  <Link
                    key={cr.id}
                    href={`/completions/${cr.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-sm bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{cr.title}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {meta.contracts?.contract_number}
                        {meta.contractors && ` · ${meta.contractors.company_name}`}
                        {' · Submitted '}{formatDate(cr.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {cr.correction_requested ? (
                        <Badge className="bg-spl-warning-bg text-spl-warning">Correction Needed</Badge>
                      ) : (
                        <Badge className={COMPLETION_STATUS_COLORS[status]}>
                          {p.role === 'contractor'
                            ? (CONTRACTOR_COMPLETION_STATUS_LABELS[status] ?? COMPLETION_STATUS_LABELS[status])
                            : COMPLETION_STATUS_LABELS[status]}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} basePath="/completions" />
        </CardContent>
      </Card>
    </div>
  )
}
