import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, ArrowRight } from 'lucide-react'
import { COMPLETION_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import type { Profile, CompletionReport, CompletionStatus } from '@/types/database'

const STATUS_COLORS: Record<CompletionStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  supervisor_review: 'bg-cyan-100 text-cyan-800',
  md_verification: 'bg-yellow-100 text-yellow-800',
  audit_review: 'bg-purple-100 text-purple-800',
  accounts_review: 'bg-orange-100 text-orange-800',
  payment_pending: 'bg-indigo-100 text-indigo-800',
  payment_completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function CompletionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  let completions: CompletionReport[] = []

  if (p.role === 'contractor') {
    const { data: contractorRaw } = await supabase.from('contractors').select('id').eq('user_id', user.id).single()
    const contractor = contractorRaw as unknown as { id: string } | null
    if (contractor) {
      const { data } = await supabase
        .from('completion_reports')
        .select('*,contracts(contract_number)')
        .eq('contractor_id', contractor.id)
        .order('submitted_at', { ascending: false })
      completions = (data ?? []) as unknown as CompletionReport[]
    }
  } else {
    const { data } = await supabase
      .from('completion_reports')
      .select('*,contracts(contract_number),contractors(company_name)')
      .order('submitted_at', { ascending: false })
    completions = (data ?? []) as unknown as CompletionReport[]
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Project Completions</h1>
        <p className="text-slate-500 mt-1">Project completion reports and verification</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">All Completion Reports ({completions.length})</CardTitle>
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
                    <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
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
                      <Badge className={STATUS_COLORS[status]}>
                        {COMPLETION_STATUS_LABELS[status]}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
