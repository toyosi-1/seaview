import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBreakdown } from '@/components/dashboard/StatusBreakdown'
import { PendingActionsWidget } from '@/components/dashboard/PendingActionsWidget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckSquare,
  Briefcase,
  ClipboardList,
  Banknote,
  Building2,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS, CONTRACTOR_STATUS_LABELS, CONTRACTOR_STATUS_COLORS, CONTRACTOR_PROPOSAL_STATUS_LABELS, ROLE_LABELS } from '@/lib/constants'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import type { Profile, Proposal, ProposalStatus, CompletionReport, ContractorStatus, UserRole } from '@/types/database'

export default async function DashboardPage() {
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  const p = profile as Profile
  const isContractor = p.role === 'contractor'

  // Fetch stats based on role
  let proposalCount = 0
  let pendingApprovalCount = 0
  let contractCount = 0
  let completionCount = 0
  let paymentPendingCount = 0
  let contractorCount = 0
  let recentActivity: Proposal[] = []

  if (isContractor) {
    const { data: contractorRaw } = await supabase
      .from('contractors').select('id').eq('user_id', user.id).single()
    const contractor = contractorRaw as unknown as { id: string } | null

    if (contractor) {
      const [{ count: pCount }, { count: cCount }, { data: recent }] = await Promise.all([
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('contractor_id', contractor.id),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('contractor_id', contractor.id),
        supabase.from('proposals').select('*,contractors(company_name)').eq('contractor_id', contractor.id).order('created_at', { ascending: false }).limit(5),
      ])
      proposalCount = pCount ?? 0
      contractCount = cCount ?? 0
      recentActivity = (recent ?? []) as unknown as Proposal[]
    }
  } else {
    const [
      { count: pAll },
      { count: pPending },
      { count: cAll },
      { count: compCount },
      { count: payPending },
      { count: conCount },
      { data: recent },
    ] = await Promise.all([
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('proposals').select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'md_review', 'procurement_appraisal', 'procurement_review', 'head_procurement_review', 'md_final_review', 'ict_assignment']),
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('completion_reports').select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'supervisor_review', 'md_verification', 'audit_review', 'accounts_review']),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contractors').select('*', { count: 'exact', head: true }),
      supabase.from('proposals').select('*,contractors(company_name)').order('updated_at', { ascending: false }).limit(8),
    ])
    proposalCount = pAll ?? 0
    pendingApprovalCount = pPending ?? 0
    contractCount = cAll ?? 0
    completionCount = compCount ?? 0
    paymentPendingCount = payPending ?? 0
    contractorCount = conCount ?? 0
    recentActivity = (recent ?? []) as unknown as Proposal[]
  }

  // Fetch proposal status breakdown for staff
  let proposalStatusData: { status: ProposalStatus; count: number }[] = []

  if (!isContractor) {
    const statuses: ProposalStatus[] = ['submitted', 'md_review', 'procurement_appraisal', 'md_final_review', 'ict_assignment', 'approved', 'rejected', 'returned']
    const statusCounts = await Promise.all(
      statuses.map(async s => {
        const { count } = await supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('status', s)
        return { status: s, count: count ?? 0 }
      })
    )
    proposalStatusData = statusCounts.filter(d => d.count > 0)
  }

  // Completions awaiting the current user's review as Project Supervisor
  const { data: supervisorPendingRaw } = await supabase
    .from('completion_reports')
    .select('*,contracts!inner(contract_number,project_supervisor_id),contractors(company_name)')
    .eq('status', 'supervisor_review')
    .eq('contracts.project_supervisor_id', user.id)
    .order('submitted_at', { ascending: false })
  const supervisorPending = (supervisorPendingRaw ?? []) as unknown as (CompletionReport & {
    contracts: { contract_number: string }
    contractors: { company_name: string }
  })[]

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-spl-navy">
            {greeting()}, {p.full_name?.split(' ')[0] ?? ROLE_LABELS[p.role as UserRole]}
          </h1>
          <p className="text-spl-text-muted text-lg mt-1">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isContractor && (
          <Button asChild size="lg" className="bg-spl-blue hover:bg-spl-blue-dark text-white h-12 px-6 text-base font-semibold">
            <Link href="/tenders">
              <Briefcase className="w-5 h-5 mr-2" />
              Browse Available Contracts
            </Link>
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isContractor ? (
          <>
            <StatCard
              title="My Quotations"
              value={proposalCount}
              icon={FileText}
              color="text-spl-blue"
              bgColor="bg-spl-blue-light"
              href="/proposals"
            />
            <StatCard
              title="Awarded Contracts"
              value={contractCount}
              icon={Briefcase}
              color="text-spl-success"
              bgColor="bg-spl-success-bg"
              href="/contracts"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Quotations"
              value={proposalCount}
              icon={FileText}
              color="text-spl-blue"
              bgColor="bg-spl-blue-light"
              href="/proposals"
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovalCount}
              icon={CheckSquare}
              color="text-spl-warning"
              bgColor="bg-spl-warning-bg"
              href="/proposals?status=pending"
              urgent={pendingApprovalCount > 0}
            />
            <StatCard
              title="Contracts Awarded"
              value={contractCount}
              icon={Briefcase}
              color="text-spl-success"
              bgColor="bg-spl-success-bg"
              href="/contracts"
            />
            <StatCard
              title="Projects Awaiting Verification"
              value={completionCount}
              icon={ClipboardList}
              color="text-spl-navy"
              bgColor="bg-spl-panel"
              href="/completions"
              urgent={completionCount > 0}
            />
            {['head_of_accounts', 'ict_admin'].includes(p.role) && (
              <StatCard
                title="Payments Pending"
                value={paymentPendingCount}
                icon={Banknote}
                color="text-spl-danger"
                bgColor="bg-spl-danger-bg"
                href="/payments"
                urgent={paymentPendingCount > 0}
              />
            )}
            <StatCard
              title="Registered Contractors"
              value={contractorCount}
              icon={Building2}
              color="text-slate-600"
              bgColor="bg-slate-100"
              href="/contractors"
            />
          </>
        )}
      </div>

      {/* Project Supervisor: Pending Completion Reviews */}
      {supervisorPending.length > 0 && (
        <Card className="border border-spl-border shadow-sm border-l-4 border-l-spl-blue">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-spl-navy flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-spl-blue" />
              Completion Reports Awaiting Your Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {supervisorPending.map(cr => (
                <Link
                  key={cr.id}
                  href={`/completions/${cr.id}`}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-spl-blue-light flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-spl-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-base">{cr.title}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {cr.contracts?.contract_number} · {cr.contractors?.company_name} · {formatRelativeTime(cr.submitted_at)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Actions Widget (staff only) */}
      {!isContractor && (
        <PendingActionsWidget actions={[
          { label: 'Quotations awaiting approval', count: pendingApprovalCount, href: '/proposals', urgent: true },
          { label: 'Completion reports awaiting verification', count: completionCount, href: '/completions', urgent: true },
          ...(p.role === 'head_of_accounts' || p.role === 'ict_admin'
            ? [{ label: 'Payments pending approval', count: paymentPendingCount, href: '/payments', urgent: true }]
            : []),
        ]} />
      )}

      {/* Proposal Status Breakdown + Recent Activity (staff only) */}
      {!isContractor && proposalStatusData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <StatusBreakdown data={proposalStatusData} title="Quotation Status Overview" />
          </div>
          <div className="lg:col-span-2">
            <Card className="border border-spl-border shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-spl-navy flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  Recent Activity
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-spl-blue hover:text-spl-blue-dark">
                  <Link href="/proposals">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-base">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentActivity.map((proposal) => {
                      const status = proposal.status as ProposalStatus
                      return (
                        <Link
                          key={proposal.id}
                          href={`/proposals/${proposal.id}`}
                          className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-full bg-spl-blue-light flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-spl-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate text-base">{proposal.title}</p>
                            <p className="text-sm text-slate-500 truncate">
                              {proposal.proposal_number} · {formatRelativeTime(proposal.updated_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-base font-bold text-slate-700 hidden sm:block">
                              {formatCurrency(proposal.estimated_cost)}
                            </p>
                            <Badge className={PROPOSAL_STATUS_COLORS[status]}>
                              {PROPOSAL_STATUS_LABELS[status]}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Activity (contractor only) */}
      {isContractor && (
        <Card className="border border-spl-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-spl-navy flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Recent Activity
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-spl-blue hover:text-spl-blue-dark">
              <Link href="/proposals">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-base">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((proposal) => {
                  const status = proposal.status as ProposalStatus
                  const statusLabel = isContractor
                    ? (CONTRACTOR_PROPOSAL_STATUS_LABELS[status] ?? PROPOSAL_STATUS_LABELS[status])
                    : PROPOSAL_STATUS_LABELS[status]
                  return (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-spl-blue-light flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-spl-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-base">{proposal.title}</p>
                        <p className="text-sm text-slate-500 truncate">
                          {proposal.proposal_number} · {formatRelativeTime(proposal.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-slate-700 hidden sm:block">
                          {formatCurrency(proposal.estimated_cost)}
                        </p>
                        <Badge className={PROPOSAL_STATUS_COLORS[status]}>
                          {statusLabel}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
