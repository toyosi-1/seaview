import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, ArrowRight } from 'lucide-react'
import { INTERNAL_PROCUREMENT_STATUS_LABELS, INTERNAL_PROCUREMENT_STATUS_COLORS, DEPARTMENT_LABELS, STAFF_ROLES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Profile, InternalProcurementRequest, InternalProcurementStatus } from '@/types/database'

export default async function InternalProcurementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile
  if (!STAFF_ROLES.includes(p.role)) redirect('/dashboard')

  const canReview = p.role === 'md' || p.role === 'head_of_procurement' || p.role === 'ict_admin'

  const { data } = await supabase
    .from('internal_procurement_requests')
    .select('*,profiles!internal_procurement_requests_requested_by_fkey(full_name)')
    .order('created_at', { ascending: false })
  const requests = (data ?? []) as unknown as (InternalProcurementRequest & { profiles?: { full_name: string } })[]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Internal Procurement</h1>
          <p className="text-slate-500 mt-1">
            {canReview ? 'All departmental procurement requests' : 'Your department procurement requests'}
          </p>
        </div>
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 text-base font-semibold">
          <Link href="/internal-procurement/new">
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(INTERNAL_PROCUREMENT_STATUS_LABELS).map(([key, label]) => {
          const count = requests.filter(r => r.status === key).length
          if (count === 0) return null
          return (
            <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${INTERNAL_PROCUREMENT_STATUS_COLORS[key as InternalProcurementStatus]}`}>
              {label} <span className="font-bold">{count}</span>
            </span>
          )
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">
            All Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingCart className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No procurement requests yet</p>
              <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/internal-procurement/new">Submit your first request</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(req => {
                const status = req.status as InternalProcurementStatus
                return (
                  <Link
                    key={req.id}
                    href={`/internal-procurement/${req.id}`}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-base truncate">{req.item_description}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {req.request_number} · {DEPARTMENT_LABELS[req.department]}
                        {req.profiles && ` · ${req.profiles.full_name ?? 'Staff'}`}
                        {' · '}{formatDate(req.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold text-slate-700 hidden md:block">
                        {formatCurrency(req.estimated_cost)}
                      </p>
                      <Badge className={INTERNAL_PROCUREMENT_STATUS_COLORS[status]}>
                        {INTERNAL_PROCUREMENT_STATUS_LABELS[status]}
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
