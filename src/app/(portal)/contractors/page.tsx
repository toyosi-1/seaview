import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, ArrowRight, Plus, AlertCircle } from 'lucide-react'
import { CONTRACTOR_STATUS_LABELS, CONTRACTOR_STATUS_COLORS, INTERNAL_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import type { Profile, Contractor, ContractorStatus } from '@/types/database'

export default async function ContractorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  if (!INTERNAL_ROLES.includes(p.role)) redirect('/dashboard')

  const { data: contractors } = await supabase
    .from('contractors')
    .select('*')
    .order('created_at', { ascending: false })

  const pendingContractors = (contractors as Contractor[] ?? []).filter(c => c.status === 'pending')
  const activeContractors = (contractors as Contractor[] ?? []).filter(c => c.status !== 'pending')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Contractors</h1>
          <p className="text-slate-500 mt-1">Manage all registered contractors</p>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingContractors.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Pending Approval ({pendingContractors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingContractors.map(c => (
                <Link
                  key={c.id}
                  href={`/contractors/${c.id}`}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-amber-50 transition-colors group border border-transparent hover:border-amber-200"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-base truncate">{c.company_name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      CAC: {c.cac_number} · TIN: {c.tin_number} · {c.email}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Contractors ({contractors?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!contractors?.length ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No contractors registered yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(contractors as Contractor[]).map(c => (
                <Link
                  key={c.id}
                  href={`/contractors/${c.id}`}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-base truncate">{c.company_name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      CAC: {c.cac_number} · TIN: {c.tin_number} · {c.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm text-slate-400 hidden md:block">{formatDate(c.created_at)}</p>
                    <Badge className={CONTRACTOR_STATUS_COLORS[c.status as ContractorStatus]}>
                      {CONTRACTOR_STATUS_LABELS[c.status as ContractorStatus]}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
