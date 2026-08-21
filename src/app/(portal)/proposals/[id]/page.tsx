import { getSessionProfile } from '@/lib/supabase/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WorkflowTimeline } from '@/components/proposals/WorkflowTimeline'
import { ApprovalPanel } from '@/components/proposals/ApprovalPanel'
import { ICTAssignmentPanel } from '@/components/proposals/ICTAssignmentPanel'
import { AppraisalDocuments } from '@/components/proposals/AppraisalDocuments'
import {
  ArrowLeft, FileText, Building2, Calendar, DollarSign, MessageSquare
} from 'lucide-react'
import {
  PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS, CONTRACTOR_PROPOSAL_STATUS_LABELS, INTERNAL_ROLES, ROLE_LABELS
} from '@/lib/constants'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import type { Profile, Proposal, ProposalTimeline, ProposalComment, ProposalDocument, ProposalStatus } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*,contractors(company_name,cac_number,contact_person,email)')
    .eq('id', id)
    .maybeSingle()
  if (!proposal) notFound()
  const prop = proposal as unknown as Proposal & { contractors: { company_name: string; cac_number: string; contact_person: string | null; email: string } }

  // Access control
  if (p.role === 'contractor') {
    const { data: contractorRaw } = await supabase.from('contractors').select('id').eq('user_id', user.id).maybeSingle()
    const contractor = contractorRaw as unknown as { id: string } | null
    if (!contractor || contractor.id !== prop.contractor_id) redirect('/proposals')
  }

  const isInternal = INTERNAL_ROLES.includes(p.role)

  const [{ data: timeline }, { data: comments }, { data: documents }] = await Promise.all([
    supabase.from('proposal_timeline').select('*,profiles(full_name)').eq('proposal_id', id).order('created_at', { ascending: true }),
    isInternal
      ? supabase.from('proposal_comments').select('*,profiles(full_name,role)').eq('proposal_id', id).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from('proposal_documents').select('*').eq('proposal_id', id),
  ])

  // Filter out appraisal documents from the regular documents list for contractors
  const visibleDocuments = (documents as ProposalDocument[] | null)?.filter(
    doc => doc.document_type !== 'appraisal_document'
  ) ?? []

  const status = prop.status as ProposalStatus
  const contractor = prop.contractors
  const statusLabel = !isInternal
    ? (CONTRACTOR_PROPOSAL_STATUS_LABELS[status] ?? PROPOSAL_STATUS_LABELS[status])
    : PROPOSAL_STATUS_LABELS[status]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500 mt-1">
          <Link href="/proposals"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-800 truncate">{prop.title}</h1>
            <Badge className={`${PROPOSAL_STATUS_COLORS[status]} text-sm px-3 py-1 font-semibold`}>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-slate-500 mt-1 text-base">{prop.proposal_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Proposal Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-spl-blue-light flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-spl-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Contractor</p>
                    <p className="font-semibold text-slate-800">{contractor?.company_name ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-spl-success-bg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-spl-success" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Estimated Cost</p>
                    <p className="font-bold text-slate-800 text-lg">{formatCurrency(prop.estimated_cost)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Submitted</p>
                    <p className="font-semibold text-slate-800">{formatDateTime(prop.submitted_at)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Description</p>
                <p className="text-slate-700 text-base leading-relaxed">{prop.description}</p>
              </div>

              {prop.rejection_reason && (
                <div className="p-4 bg-spl-danger-bg rounded-xl border border-red-100">
                  <p className="text-sm font-semibold text-spl-danger mb-1">Rejection Reason</p>
                  <p className="text-sm text-spl-danger">{prop.rejection_reason}</p>
                </div>
              )}
              {prop.return_reason && (
                <div className="p-4 bg-spl-warning-bg rounded-xl border border-amber-100">
                  <p className="text-sm font-semibold text-spl-warning mb-1">Returned For</p>
                  <p className="text-sm text-spl-warning">{prop.return_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {!visibleDocuments.length ? (
                <p className="text-slate-400 text-center py-6">No documents uploaded</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleDocuments.map(doc => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-spl-blue-light transition-all"
                    >
                      <FileText className="w-7 h-7 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate capitalize">
                          {doc.document_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Comments — staff only */}
          {isInternal && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Internal Minutes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!comments?.length ? (
                  <p className="text-slate-400 text-center py-6">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {(comments as ProposalComment[]).map(c => {
                      const author = c.profiles as { full_name: string | null; role: string | null } | undefined
                      const authorName = author?.full_name
                        ? author.full_name
                        : author?.role
                          ? ROLE_LABELS[author.role as keyof typeof ROLE_LABELS] ?? author.role
                          : 'Staff'
                      const authorInitials = author?.full_name
                        ? author.full_name.slice(0, 2).toUpperCase()
                        : author?.role
                          ? (ROLE_LABELS[author.role as keyof typeof ROLE_LABELS] ?? author.role).slice(0, 2).toUpperCase()
                          : '??'
                      return (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-9 h-9 rounded-sm bg-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                            {authorInitials}
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-700">
                                {authorName}
                              </p>
                              {c.action && (
                                <Badge variant="outline" className="text-xs capitalize">{c.action}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{c.comment}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatDateTime(c.created_at)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Supporting Appraisal Documents — internal staff only */}
          {isInternal && ['procurement_appraisal', 'procurement_review', 'md_final_review', 'ict_assignment', 'approved'].includes(status) && (
            <AppraisalDocuments proposalId={prop.id} />
          )}

          {/* Approval Panel */}
          {isInternal && ['submitted', 'md_review', 'procurement_appraisal', 'procurement_review', 'head_procurement_review', 'md_final_review'].includes(status) && (
            <ApprovalPanel proposal={prop} profile={p} />
          )}

          {/* ICT Department Assignment */}
          {isInternal && status === 'ict_assignment' && (
            <ICTAssignmentPanel proposal={prop} profile={p} />
          )}
        </div>

        {/* Sidebar — Workflow */}
        <div className="space-y-5">
          <Card className="border border-spl-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-spl-navy">Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline
                status={status}
                timeline={(timeline ?? []) as unknown as ProposalTimeline[]}
              />
            </CardContent>
          </Card>

          {/* Contractor Summary */}
          {isInternal && contractor && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700">Contractor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-slate-500">Company:</span> <span className="font-medium">{contractor.company_name}</span></p>
                <p><span className="text-slate-500">Contact:</span> <span className="font-medium">{contractor.contact_person ?? '—'}</span></p>
                <p><span className="text-slate-500">Email:</span> <span className="font-medium">{contractor.email}</span></p>
                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                  <Link href={`/contractors/${prop.contractor_id}`}>View Full Profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
