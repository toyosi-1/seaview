import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Building2, Mail, Landmark, CreditCard, FileText, ExternalLink } from 'lucide-react'
import { CONTRACTOR_STATUS_LABELS, CONTRACTOR_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/format'
import type { Profile, Contractor, ContractorDocument, ContractorStatus } from '@/types/database'

export default async function ContractorProfilePage() {
  const { supabase, user } = await getSessionProfile()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile || (profile as Profile).role !== 'contractor') redirect('/dashboard')

  const { data: contractor } = await supabase
    .from('contractors').select('*').eq('user_id', user.id).maybeSingle()

  if (!contractor) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">No Profile Found</h2>
        <p className="text-slate-500 mb-6">Complete your contractor registration to access the portal.</p>
        <Button asChild className="bg-spl-blue hover:bg-spl-blue-dark text-white h-12 px-8">
          <Link href="/register">Complete Registration</Link>
        </Button>
      </div>
    )
  }

  const c = contractor as Contractor

  const { data: documents } = await supabase
    .from('contractor_documents').select('*').eq('contractor_id', c.id)

  const infoItem = (icon: React.ReactNode, label: string, value: string | null) => (
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-spl-blue-light flex items-center justify-center">
            <Building2 className="w-8 h-8 text-spl-blue" />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-700">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoItem(<FileText className="w-4 h-4 text-slate-500" />, 'CAC Registration Number', c.cac_number)}
            {infoItem(<FileText className="w-4 h-4 text-slate-500" />, 'TIN Number', c.tin_number)}
            {infoItem(<Mail className="w-4 h-4 text-slate-500" />, 'Email Address', c.email)}
            {infoItem(<Building2 className="w-4 h-4 text-slate-500" />, 'Contact Person', c.contact_person)}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-700">Banking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoItem(<Landmark className="w-4 h-4 text-slate-500" />, 'Bank Name', c.bank_name)}
            {infoItem(<CreditCard className="w-4 h-4 text-slate-500" />, 'Account Number', c.account_number)}
            {infoItem(<Building2 className="w-4 h-4 text-slate-500" />, 'Account Name', c.account_name)}
            <Separator />
            <p className="text-xs text-slate-500">
              You can update your company and banking details in <Link href="/settings" className="text-spl-blue hover:underline">Account Settings</Link>.
            </p>
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
            <p className="text-slate-400 text-center py-8">No documents on file</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(documents as ContractorDocument[]).map(doc => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-spl-blue-light transition-all group"
                >
                  <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate capitalize">
                      {doc.document_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-auto flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
