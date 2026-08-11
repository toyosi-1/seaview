import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CompletionActions } from './CompletionActions'
import { ArrowLeft, FileText, Image } from 'lucide-react'
import { COMPLETION_STATUS_LABELS, INTERNAL_ROLES } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils/format'
import type { Profile, CompletionReport, CompletionStatus, CompletionDocument } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

const STATUS_COLORS: Record<CompletionStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  supervisor_review: 'bg-cyan-100 text-cyan-800',
  md_verification: 'bg-yellow-100 text-yellow-800',
  audit_review: 'bg-purple-100 text-purple-800',
  accounts_review: 'bg-orange-100 text-orange-800',
  payment_pending: 'bg-indigo-100 text-indigo-800',
  payment_completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function CompletionDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: cr } = await supabase
    .from('completion_reports')
    .select('*,contracts(contract_number,contract_value,title,project_supervisor_id),contractors(company_name,contact_person,email)')
    .eq('id', id)
    .single()
  if (!cr) notFound()

  const { data: docs } = await supabase
    .from('completion_documents').select('*').eq('completion_id', id)

  const report = cr as unknown as CompletionReport & {
    contracts: { contract_number: string; contract_value: number; title: string; project_supervisor_id: string | null }
    contractors: { company_name: string; contact_person: string | null; email: string }
  }
  const projectSupervisorId = report.contracts?.project_supervisor_id ?? null
  const status = report.status as CompletionStatus
  const typedDocs = (docs ?? []) as unknown as CompletionDocument[]
  const images = typedDocs.filter(d => d.document_type === 'image')
  const otherDocs = typedDocs.filter(d => d.document_type !== 'image')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/completions"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-800 truncate">{report.title}</h1>
            <Badge className={STATUS_COLORS[status]}>{COMPLETION_STATUS_LABELS[status]}</Badge>
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
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600">{report.rejection_reason}</p>
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
                  <Image className="w-5 h-5" />
                  Completion Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map(img => (
                    <a key={img.id} href={img.file_url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors aspect-square bg-slate-100">
                      <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
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
                      className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
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

          {/* Actions for internal staff */}
          {INTERNAL_ROLES.includes(p.role) && (
            <CompletionActions completion={report} profile={p} projectSupervisorId={projectSupervisorId} />
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
