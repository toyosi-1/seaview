import { getSessionProfile } from '@/lib/supabase/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShoppingCart, DollarSign, Calendar } from 'lucide-react'
import { INTERNAL_PROCUREMENT_STATUS_LABELS, INTERNAL_PROCUREMENT_STATUS_COLORS, DEPARTMENT_LABELS } from '@/lib/constants'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { InternalProcurementActions } from './InternalProcurementActions'
import type { Profile, InternalProcurementRequest, InternalProcurementStatus } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

export default async function InternalProcurementDetailPage({ params }: PageProps) {
  const { id } = await params
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: reqRaw } = await supabase
    .from('internal_procurement_requests')
    .select('*,profiles!internal_procurement_requests_requested_by_fkey(full_name,email,department)')
    .eq('id', id)
    .single()
  if (!reqRaw) notFound()

  const req = reqRaw as unknown as InternalProcurementRequest & { profiles: { full_name: string; email: string; department: string | null } }
  const status = req.status as InternalProcurementStatus

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/internal-procurement"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800 truncate">{req.item_description}</h1>
            <Badge className={INTERNAL_PROCUREMENT_STATUS_COLORS[status]}>{INTERNAL_PROCUREMENT_STATUS_LABELS[status]}</Badge>
          </div>
          <p className="text-slate-500 mt-1">{req.request_number} · {DEPARTMENT_LABELS[req.department]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-spl-success-bg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-spl-success" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Estimated Cost</p>
                    <p className="font-bold text-slate-800 text-lg">{formatCurrency(req.estimated_cost)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Submitted</p>
                    <p className="font-semibold text-slate-800">{formatDateTime(req.created_at)}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Quantity</p>
                <p className="font-semibold text-slate-800 mt-0.5">{req.quantity}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Justification</p>
                <p className="text-slate-700 text-base leading-relaxed">{req.reason}</p>
              </div>
              {req.rejection_reason && (
                <div className="p-4 bg-spl-danger-bg rounded-xl border border-red-100">
                  <p className="text-sm font-semibold text-spl-danger mb-1">Rejection Reason</p>
                  <p className="text-sm text-spl-danger">{req.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <InternalProcurementActions request={req} profile={p} />
        </div>

        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Requested By
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-slate-500">Name:</span> <span className="font-semibold">{req.profiles?.full_name ?? 'Staff'}</span></p>
              <p><span className="text-slate-500">Email:</span> <span className="font-semibold">{req.profiles?.email}</span></p>
              <p><span className="text-slate-500">Department:</span> <span className="font-semibold">{DEPARTMENT_LABELS[req.department]}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
