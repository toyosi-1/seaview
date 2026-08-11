import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Plus, ArrowRight, CalendarDays } from 'lucide-react'
import { TENDER_STATUS_LABELS, TENDER_STATUS_COLORS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Profile, Tender, TenderStatus } from '@/types/database'

export default async function TendersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  const isContractor = p.role === 'contractor'
  const isContractOfficer = p.role === 'contract_officer'

  let query = supabase
    .from('tenders')
    .select('*,profiles!tenders_posted_by_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (isContractor) {
    query = query.in('status', ['open', 'awarded', 'closed'])
  }

  const { data: tendersRaw } = await query
  const tenders = (tendersRaw ?? []) as unknown as (Tender & { profiles?: { full_name: string } })[]

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
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 text-base font-semibold">
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
            const count = tenders.filter(t => t.status === key).length
            if (count === 0) return null
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${TENDER_STATUS_COLORS[key as TenderStatus]}`}>
                {label} <span className="font-bold">{count}</span>
              </span>
            )
          })}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Contracts ({tenders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No contracts available</p>
              {isContractOfficer && (
                <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/tenders/new">Post your first contract</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tenders.map(tender => {
                const status = tender.status as TenderStatus
                const poster = tender.profiles
                return (
                  <Link
                    key={tender.id}
                    href={`/tenders/${tender.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{tender.title}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {tender.contract_number}
                        {poster && ` · Posted by ${poster.full_name ?? 'Staff'}`}
                        {tender.closing_date && (
                          <> · <CalendarDays className="w-3.5 h-3.5 inline -mt-0.5" /> Closes {formatDate(tender.closing_date)}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(tender.estimated_value)}
                      </p>
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
        </CardContent>
      </Card>
    </div>
  )
}
