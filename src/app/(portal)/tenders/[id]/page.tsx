import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Briefcase, CalendarDays, FileText, User, Plus } from 'lucide-react'
import { TENDER_STATUS_LABELS, TENDER_STATUS_COLORS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Profile, Tender, TenderStatus } from '@/types/database'

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: tenderRaw } = await supabase
    .from('tenders')
    .select('*,profiles!tenders_posted_by_fkey(full_name)')
    .eq('id', id)
    .single()

  if (!tenderRaw) notFound()
  const tender = tenderRaw as unknown as Tender & { profiles?: { full_name: string } }

  const isContractor = p.role === 'contractor'
  const isContractOfficer = p.role === 'contract_officer'
  const status = tender.status as TenderStatus

  // Check if contractor already submitted a proposal for this tender
  let alreadySubmitted = false
  if (isContractor) {
    const { data: contractorRaw } = await supabase
      .from('contractors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    const contractor = contractorRaw as unknown as { id: string } | null
    if (contractor) {
      const { count } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('tender_id', id)
        .eq('contractor_id', contractor.id)
      alreadySubmitted = (count ?? 0) > 0
    }
  }

  // Get proposal count for staff
  let proposalCount = 0
  if (!isContractor) {
    const { count } = await supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('tender_id', id)
    proposalCount = count ?? 0
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-slate-500">
        <Link href="/tenders">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contracts
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{tender.title}</h1>
              <p className="text-sm text-slate-500 font-mono">{tender.contract_number}</p>
            </div>
          </div>
        </div>
        <Badge className={`${TENDER_STATUS_COLORS[status]} text-sm px-3 py-1`}>
          {TENDER_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Estimated Value</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(tender.estimated_value)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Closing Date
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {tender.closing_date ? formatDate(tender.closing_date) : 'Open'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Posted By
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1">{tender.profiles?.full_name ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-700">Contract Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{tender.description}</p>
        </CardContent>
      </Card>

      {tender.requirements && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{tender.requirements}</p>
          </CardContent>
        </Card>
      )}

      {!isContractor && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Quotations Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">{proposalCount}</p>
            <p className="text-sm text-slate-500 mt-1">
              {proposalCount === 0 ? 'No quotations submitted yet' : `${proposalCount} quotation${proposalCount > 1 ? 's' : ''} received`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action area */}
      <div className="flex gap-4 pb-8">
        {isContractor && status === 'open' && !alreadySubmitted && (
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base font-semibold">
            <Link href={`/proposals/new?tender=${tender.id}`}>
              <Plus className="w-5 h-5 mr-2" />
              Submit Quotation
            </Link>
          </Button>
        )}
        {isContractor && alreadySubmitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-green-700 font-medium">
            You have already submitted a quotation for this contract.
          </div>
        )}
        {isContractor && status !== 'open' && !alreadySubmitted && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-6 py-4 text-slate-500 font-medium">
            This contract is no longer accepting quotations.
          </div>
        )}
        {isContractOfficer && (
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
            <Link href="/tenders">Back to All Contracts</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
