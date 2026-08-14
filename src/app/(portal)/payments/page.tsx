import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Banknote, ArrowRight } from 'lucide-react'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Profile, Payment, PaymentStatus } from '@/types/database'

export default async function PaymentsPage() {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  let payments: Payment[] = []

  if (p.role === 'contractor') {
    const { data: contractorRaw } = await supabase.from('contractors').select('id').eq('user_id', user.id).single()
    const contractor = contractorRaw as unknown as { id: string } | null
    if (contractor) {
      const { data } = await supabase
        .from('payments')
        .select('*,contracts(title,contract_number)')
        .eq('contractor_id', contractor.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      payments = (data ?? []) as unknown as Payment[]
    }
  } else if (['head_of_accounts', 'md', 'ict_admin'].includes(p.role)) {
    const { data } = await supabase
      .from('payments')
      .select('*,contractors(company_name),contracts(title,contract_number)')
      .order('created_at', { ascending: false })
    payments = (data ?? []) as unknown as Payment[]
  } else {
    const { data } = await supabase
      .from('payments')
      .select('*,contractors(company_name),contracts(title,contract_number)')
      .order('created_at', { ascending: false })
    payments = (data ?? []) as unknown as Payment[]
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-500 mt-1">
          {p.role === 'contractor' ? 'Your completed payments' : 'All contractor payments'}
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">All Payments ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Banknote className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(pay => {
                const status = pay.status as PaymentStatus
                const meta = pay as unknown as { contractors?: { company_name: string }; contracts?: { title: string; contract_number: string } }
                return (
                  <Link
                    key={pay.id}
                    href={`/payments/${pay.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{pay.payment_number}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {meta.contracts?.contract_number}
                        {meta.contractors && ` · ${meta.contractors.company_name}`}
                        {pay.payment_date && ` · ${formatDate(pay.payment_date)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(pay.net_amount ?? pay.amount)}
                      </p>
                      <Badge className={PAYMENT_STATUS_COLORS[status]}>
                        {PAYMENT_STATUS_LABELS[status]}
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
