import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Profile, Contract } from '@/types/database'

export default async function ContractsPage() {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  let contracts: Contract[] = []

  if (p.role === 'contractor') {
    const { data: contractorRaw } = await supabase.from('contractors').select('id').eq('user_id', user.id).single()
    const contractor = contractorRaw as unknown as { id: string } | null
    if (contractor) {
      const { data } = await supabase
        .from('contracts')
        .select('*,contractors(company_name)')
        .eq('contractor_id', contractor.id)
        .order('awarded_at', { ascending: false })
      contracts = (data ?? []) as unknown as Contract[]
    }
  } else {
    const { data } = await supabase
      .from('contracts')
      .select('*,contractors(company_name)')
      .order('awarded_at', { ascending: false })
    contracts = (data ?? []) as unknown as Contract[]
  }

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
          <CardTitle className="text-lg font-semibold text-slate-700">All Contracts ({contracts.length})</CardTitle>
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
                const contractor = (c as unknown as { contractors?: { company_name: string } }).contractors
                return (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-full bg-spl-success-bg flex items-center justify-center flex-shrink-0">
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
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(c.contract_value)}
                      </p>
                      <Badge className={statusColor(c.status)}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
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
