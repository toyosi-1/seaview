import { getSessionProfile } from '@/lib/supabase/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CompletionActions } from './CompletionActions'
import { ArrowLeft, FileText, Image as ImageIcon, Banknote } from 'lucide-react'
import { COMPLETION_STATUS_LABELS, CONTRACTOR_COMPLETION_STATUS_LABELS, INTERNAL_ROLES, COMPLETION_STATUS_COLORS } from '@/lib/constants'
import { formatDateTime, formatCurrency } from '@/lib/utils/format'
import type { Profile, CompletionReport, CompletionStatus, CompletionDocument } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

export default async function CompletionDetailPage({ params }: PageProps) {
  const { id } = await params
  const { supabase, user, profile } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: cr } = await supabase
    .from('completion_reports')
    .select('*,contracts(contract_number,contract_value,title,project_supervisor_id),contractors(company_name,contact_person,email,bank_name,account_number,account_name)')
    .eq('id', id)
    .maybeSingle()
  if (!cr) notFound()

  const { data: docs } = await supabase
    .from('completion_documents').select('*').eq('completion_id', id)

  const report = cr as unknown as CompletionReport & {
    contracts: { contract_number: string; contract_value: number; title: string; project_supervisor_id: string | null }
    contractors: { company_name: string; contact_person: string | null; email: string; bank_name: string; account_number: string; account_name: string }
  }
  const projectSupervisorId = report.contracts?.project_supervisor_id ?? null
  const status = report.status as CompletionStatus
  const typedDocs = (docs ?? []) as unknown as CompletionDocument[]
  const images = typedDocs.filter(d => d.document_type === 'image')
  const otherDocs = typedDocs.filter(d => d.document_type !== 'image')

  const isContractor = p.role === 'contractor'
  const statusLabel = isContractor
    ? (CONTRACTOR_COMPLETION_STATUS_LABELS[status] ?? COMPLETION_STATUS_LABELS[status])
    : COMPLETION_STATUS_LABELS[status]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/completions"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-800 truncate">{report.title}</h1>
            <Badge className={COMPLETION_STATUS_COLORS[status]}>{statusLabel}</Badge>
          </div>
          <p className="text-slate-500 mt-1">{report.contracts?.contract_number} · Submitted {formatDateTime(report.submitted_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 text-base leading-relaxed">{report.description}</p>
              {report.rejection_reason && (
                <div className="mt-4 p-4 bg-spl-danger-bg rounded-xl border border-red-100">
                  <p className="text-sm font-semibold text-spl-danger mb-1">Rejection Reason</p>
                  <p className="text-sm text-spl-danger">{report.rejection_reason}</p>
                </div>
              )}
              {report.audit_comment && INTERNAL_ROLES.includes(p.role) && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Audit Comment</p>
                  <p className="text-sm text-slate-600">{report.audit_comment}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          {images.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Completion Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map(img => (
                    <a key={img.id} href={img.file_url} target="_blank" rel="noopener noreferrer"
                      className="relative block rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors aspect-square bg-slate-100">
                      <Image src={img.file_url} alt={img.file_name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {otherDocs.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherDocs.map(doc => (
                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-spl-blue-light transition-all">
                      <FileText className="w-7 h-7 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment preview for accounts staff */}
          {p.role === 'head_of_accounts' && status === 'accounts_review' && (
            <Card className="border-0 shadow-sm border-l-4 border-l-spl-success">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-spl-success" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Payment Amount</p>
                    <p className="font-bold text-slate-800 text-2xl mt-0.5">{formatCurrency(report.contracts?.contract_value ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Contractor</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{report.contractors?.company_name}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Bank</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{report.contractors?.bank_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Account Number</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{report.contractors?.account_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Account Name</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{report.contractors?.account_name || '—'}</p>
                  </div>
                </div>
                <div className="p-3 bg-spl-success-bg rounded-xl text-sm text-slate-600">
                  Review the bank details above, make the payment externally, then click <strong>Payment Made</strong> to close out this contract.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions for internal staff */}
          {INTERNAL_ROLES.includes(p.role) && (
            <CompletionActions completion={report} profile={p} projectSupervisorId={projectSupervisorId} />
          )}

          {/* Workflow guide for contractors */}
          {isContractor && (
            <Card className="border-0 shadow-sm bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700">Payment Process</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0 ${['supervisor_review', 'md_verification', 'audit_review', 'accounts_review', 'payment_pending', 'payment_completed'].includes(status) ? 'bg-spl-success text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Submit Completion Report</p>
                      <p className="text-xs text-slate-500">You upload evidence of job completion</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0 ${['md_verification', 'audit_review', 'accounts_review', 'payment_pending', 'payment_completed'].includes(status) ? 'bg-spl-success text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Project Supervisor Review</p>
                      <p className="text-xs text-slate-500">Supervisor verifies the work on-site</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0 ${['audit_review', 'accounts_review', 'payment_pending', 'payment_completed'].includes(status) ? 'bg-spl-success text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">MD Final Acceptance</p>
                      <p className="text-xs text-slate-500">Managing Director gives final approval</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0 ${['accounts_review', 'payment_pending', 'payment_completed'].includes(status) ? 'bg-spl-success text-white' : 'bg-slate-200 text-slate-500'}`}>4</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Audit & Accounts Review</p>
                      <p className="text-xs text-slate-500">Finance team processes your payment</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0 ${status === 'payment_completed' ? 'bg-spl-success text-white' : status === 'payment_pending' ? 'bg-spl-blue text-white' : 'bg-slate-200 text-slate-500'}`}>5</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Payment Completed</p>
                      <p className="text-xs text-slate-500">Funds transferred to your bank account</p>
                    </div>
                  </li>
                </ol>
                {status === 'rejected' && (
                  <div className="mt-4 p-3 bg-spl-danger-bg rounded-lg border border-red-100">
                    <p className="text-sm text-spl-danger font-medium">Your completion report was rejected. Please review the rejection reason above and submit a new report.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Contract Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-slate-500">Contract:</span> <span className="font-semibold">{report.contracts?.title}</span></p>
              <p><span className="text-slate-500">Number:</span> <span className="font-semibold">{report.contracts?.contract_number}</span></p>
              <Separator />
              <p><span className="text-slate-500">Contractor:</span> <span className="font-semibold">{report.contractors?.company_name}</span></p>
              <p><span className="text-slate-500">Contact:</span> <span className="font-semibold">{report.contractors?.contact_person ?? '—'}</span></p>
              <p><span className="text-slate-500">Email:</span> <span className="font-semibold">{report.contractors?.email}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
