import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ArrowRight } from 'lucide-react'
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

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  if (!['head_of_audit', 'md', 'ict_admin'].includes(p.role)) redirect('/dashboard')

  const { data: completions } = await supabase
    .from('completion_reports')
    .select('*,contracts(contract_number,title,contract_value),contractors(company_name)')
    .eq('status', 'audit_review')
    .order('submitted_at', { ascending: true })

  const { data: allCompleted } = await supabase
    .from('completion_reports')
    .select('*,contracts(contract_number,title),contractors(company_name)')
    .in('status', ['accounts_review', 'payment_pending', 'payment_completed'])
    .order('updated_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Audit Reviews</h1>
        <p className="text-slate-500 mt-1">Review and approve project completion reports</p>
      </div>

      {/* Pending Audit */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
            Pending Audit Review ({completions?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!completions?.length ? (
            <div className="text-center py-12 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base">No completion reports awaiting audit review</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(completions as unknown as (CompletionReport & { contracts: { contract_number: string; title: string; contract_value: number }; contractors: { company_name: string } })[]).map(cr => (
                <Link
                  key={cr.id}
                  href={`/completions/${cr.id}`}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-slate-100 hover:border-purple-200"
                >
                  <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-base truncate">{cr.title}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {cr.contractors?.company_name} · {cr.contracts?.contract_number} · Submitted {formatDate(cr.submitted_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={STATUS_COLORS[cr.status as CompletionStatus]}>
                      {COMPLETION_STATUS_LABELS[cr.status as CompletionStatus]}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Processed */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">Recently Processed</CardTitle>
        </CardHeader>
        <CardContent>
          {!allCompleted?.length ? (
            <div className="text-center py-8 text-slate-400 text-sm">No processed items yet</div>
          ) : (
            <div className="space-y-2">
              {(allCompleted as unknown as (CompletionReport & { contracts: { contract_number: string; title: string }; contractors: { company_name: string } })[]).map(cr => (
                <Link
                  key={cr.id}
                  href={`/completions/${cr.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">{cr.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {cr.contractors?.company_name} · {cr.contracts?.contract_number}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[cr.status as CompletionStatus]}>
                    {COMPLETION_STATUS_LABELS[cr.status as CompletionStatus]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
