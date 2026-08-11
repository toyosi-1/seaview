import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ContractorActions } from './ContractorActions'
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Landmark, CreditCard, FileText, Calendar
} from 'lucide-react'
import { CONTRACTOR_STATUS_LABELS, CONTRACTOR_STATUS_COLORS, INTERNAL_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import type { Profile, Contractor, ContractorDocument, ContractorStatus } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

export default async function ContractorDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: contractor } = await supabase.from('contractors').select('*').eq('id', id).single()
  if (!contractor) notFound()
  const c = contractor as Contractor

  const { data: documents } = await supabase
    .from('contractor_documents').select('*').eq('contractor_id', id).order('created_at', { ascending: false })

  const isOwner = p.role === 'contractor' && c.user_id === user.id
  const isStaff = INTERNAL_ROLES.includes(p.role)
  if (!isOwner && !isStaff) redirect('/dashboard')

  const infoRow = (icon: React.ReactNode, label: string, value: string | null) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-base font-semibold text-slate-800 mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="text-slate-500">
        <Link href="/contractors"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{c.company_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={CONTRACTOR_STATUS_COLORS[c.status as ContractorStatus]}>
                {CONTRACTOR_STATUS_LABELS[c.status as ContractorStatus]}
              </Badge>
              <span className="text-slate-400 text-sm">Registered {formatDate(c.created_at)}</span>
            </div>
          </div>
        </div>
        {isStaff && (
          <ContractorActions contractor={c} currentRole={p.role} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-700">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoRow(<FileText className="w-4 h-4 text-slate-500" />, 'CAC Number', c.cac_number)}
            {infoRow(<FileText className="w-4 h-4 text-slate-500" />, 'TIN Number', c.tin_number)}
            {infoRow(<Phone className="w-4 h-4 text-slate-500" />, 'Phone', c.phone)}
            {infoRow(<Mail className="w-4 h-4 text-slate-500" />, 'Email', c.email)}
            {infoRow(<MapPin className="w-4 h-4 text-slate-500" />, 'Address', c.address)}
            {infoRow(<Calendar className="w-4 h-4 text-slate-500" />, 'Contact Person', c.contact_person)}
          </CardContent>
        </Card>

        {/* Banking Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-700">Banking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoRow(<Landmark className="w-4 h-4 text-slate-500" />, 'Bank Name', c.bank_name)}
            {infoRow(<CreditCard className="w-4 h-4 text-slate-500" />, 'Account Number', c.account_number)}
            {infoRow(<Building2 className="w-4 h-4 text-slate-500" />, 'Account Name', c.account_name)}
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700">Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {!documents?.length ? (
            <p className="text-slate-400 text-center py-8">No documents uploaded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(documents as ContractorDocument[]).map(doc => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
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
    </div>
  )
}
