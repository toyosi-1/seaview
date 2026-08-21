import { getSessionProfile } from '@/lib/supabase/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, FileText } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { DEPARTMENT_LABELS, ROLE_LABELS, DEPARTMENT_HEAD_ROLE } from '@/lib/constants'
import { DownloadAwardLetter } from './DownloadAwardLetter'
import { TerminateContract } from './TerminateContract'
import { CompletionPeriodEditor } from './CompletionPeriodEditor'
import type { Profile, Contract, UserRole } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: contract } = await supabase
    .from('contracts')
    .select('*,contractors(company_name,contact_person,email,phone,address,bank_name,account_number,account_name),proposals(proposal_number,description,submitted_at),project_supervisor:profiles!contracts_project_supervisor_id_fkey(full_name,role)')
    .eq('id', id)
    .maybeSingle()
  if (!contract) notFound()

  const c = contract as unknown as Contract & {
    contractors: { company_name: string; contact_person: string | null; email: string; phone: string | null; address: string | null; bank_name: string; account_number: string; account_name: string }
    proposals: { proposal_number: string; description: string; submitted_at: string }
    project_supervisor: { full_name: string | null; role: UserRole } | null
  }

  const { data: mdProfileRaw } = await supabase
    .from('profiles')
    .select('full_name,signature_url,role')
    .eq('role', 'md')
    .eq('is_active', true)
    .maybeSingle()
  const mdProfile = mdProfileRaw as unknown as { full_name: string; signature_url: string | null; role: UserRole } | null

  // Fallback: if a department is assigned but no supervisor is stored (legacy data),
  // resolve the current department head's role/name dynamically.
  const supervisorRole = c.responsible_department ? DEPARTMENT_HEAD_ROLE[c.responsible_department] : null
  const { data: departmentHeadRaw } = supervisorRole
    ? await supabase
        .from('profiles')
        .select('full_name,role')
        .eq('role', supervisorRole)
        .eq('is_active', true)
        .maybeSingle()
    : { data: null }
  const departmentHead = departmentHeadRaw as unknown as { full_name: string | null; role: UserRole } | null

  const INTERNAL_EDIT_ROLES: UserRole[] = ['md', 'head_of_procurement', 'ict_admin']

  const statusColor = c.status === 'active' ? 'bg-spl-success-bg text-spl-success' :
    c.status === 'completed' ? 'bg-spl-blue-light text-spl-blue-dark' : 'bg-spl-danger-bg text-spl-danger'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/contracts"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-800">{c.title}</h1>
            <Badge className={statusColor}>
              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
            </Badge>
          </div>
          <p className="text-slate-500 mt-1 text-base">{c.contract_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Contract Number</p>
                  <p className="font-bold text-slate-800 text-lg mt-0.5">{c.contract_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Contract Value</p>
                  <p className="font-bold text-spl-success text-2xl mt-0.5">{formatCurrency(c.contract_value)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Awarded</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(c.awarded_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Reference</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{c.approval_reference ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Completion Period</p>
                  <CompletionPeriodEditor
                    contractId={c.id}
                    completionPeriod={c.completion_period}
                    editable={INTERNAL_EDIT_ROLES.includes(p.role)}
                  />
                </div>
              </div>

              {c.proposals && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Quotation Description</p>
                    <p className="text-slate-700 text-base leading-relaxed">{c.proposals.description}</p>
                    <Link href={`/proposals`} className="text-sm text-spl-blue hover:underline mt-2 inline-block">
                      View Quotation {c.proposals.proposal_number}
                    </Link>
                  </div>
                </>
              )}

              {c.responsible_department && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Responsible Department</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{DEPARTMENT_LABELS[c.responsible_department]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Project Supervisor</p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {c.project_supervisor?.full_name
                          ?? (c.project_supervisor ? ROLE_LABELS[c.project_supervisor.role] : null)
                          ?? departmentHead?.full_name
                          ?? (departmentHead ? ROLE_LABELS[departmentHead.role] : null)
                          ?? '—'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {c.responsible_department ? (
                <>
                  <Separator />
                  <DownloadAwardLetter
                    contractNumber={c.contract_number}
                    proposalNumber={c.proposals?.proposal_number ?? ''}
                    contractorName={c.contractors?.company_name ?? ''}
                    contractorAddress={c.contractors?.address ?? undefined}
                    contractorPhone={c.contractors?.phone ?? undefined}
                    contractTitle={c.title}
                    contractValue={c.contract_value}
                    awardDate={c.awarded_at}
                    bidDate={c.proposals?.submitted_at ?? undefined}
                    completionPeriod={c.completion_period ?? undefined}
                    mdName={mdProfile?.full_name ?? 'Managing Director'}
                    mdSignatureUrl={mdProfile?.signature_url ?? undefined}
                  />
                </>
              ) : (
                <>
                  <Separator />
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-spl-warning-bg">
                    <FileText className="w-7 h-7 text-amber-500" />
                    <div>
                      <p className="font-semibold text-spl-warning">Award Letter Pending</p>
                      <p className="text-xs text-spl-warning">Available once ICT assigns a responsible department</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Completion CTA for contractors */}
          {p.role === 'contractor' && c.status === 'active' && (
            <Card className="border-0 shadow-sm bg-spl-blue-light border-blue-100">
              <CardContent className="p-5">
                <h3 className="font-bold text-spl-blue-dark text-lg">Ready to submit project completion?</h3>
                <p className="text-spl-blue text-sm mt-1 mb-4">
                  Once your project is complete, submit your completion report and evidence for verification.
                </p>
                <Button asChild className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11">
                  <Link href={`/completions/new?contract_id=${c.id}`}>
                    Submit Completion Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Terminate Contract — MD / ICT Admin only */}
          {['md', 'ict_admin'].includes(p.role) && c.status === 'active' && (
            <div className="flex justify-end">
              <TerminateContract contract={c} profile={p} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Contractor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-slate-500">Company:</span> <span className="font-semibold">{c.contractors?.company_name}</span></p>
              <p><span className="text-slate-500">Contact:</span> <span className="font-semibold">{c.contractors?.contact_person ?? '—'}</span></p>
              <p><span className="text-slate-500">Email:</span> <span className="font-semibold">{c.contractors?.email}</span></p>
              <p><span className="text-slate-500">Phone:</span> <span className="font-semibold">{c.contractors?.phone ?? '—'}</span></p>
              <Separator />
              <p><span className="text-slate-500">Bank:</span> <span className="font-semibold">{c.contractors?.bank_name}</span></p>
              <p><span className="text-slate-500">Account:</span> <span className="font-semibold">{c.contractors?.account_number}</span></p>
              <p><span className="text-slate-500">Account Name:</span> <span className="font-semibold">{c.contractors?.account_name}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
