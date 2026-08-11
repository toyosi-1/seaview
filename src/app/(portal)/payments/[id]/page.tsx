import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PaymentActions } from './PaymentActions'
import { ArrowLeft, Banknote, FileText, Download } from 'lucide-react'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/constants'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import type { Profile, Payment, PaymentStatus, PaymentDocument } from '@/types/database'

interface PageProps { params: Promise<{ id: string }> }

export default async function PaymentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const p = profile as Profile

  const { data: payment } = await supabase
    .from('payments')
    .select('*,contractors(company_name,bank_name,account_number,account_name),contracts(title,contract_number)')
    .eq('id', id)
    .single()
  if (!payment) notFound()

  const { data: docs } = await supabase
    .from('payment_documents').select('*').eq('payment_id', id)

  const pay = payment as unknown as Payment & {
    contractors: { company_name: string; bank_name: string; account_number: string; account_name: string }
    contracts: { title: string; contract_number: string }
  }
  const status = pay.status as PaymentStatus

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/payments"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-800">{pay.payment_number}</h1>
            <Badge className={PAYMENT_STATUS_COLORS[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>
          </div>
          <p className="text-slate-500 mt-1">{pay.contracts?.contract_number} · Created {formatDateTime(pay.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Payment Amount</p>
                  <p className="font-bold text-slate-800 text-2xl mt-0.5">{formatCurrency(pay.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tax Deduction</p>
                  <p className="font-semibold text-red-600 text-lg mt-0.5">-{formatCurrency(pay.tax_deduction)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Net Payment</p>
                  <p className="font-bold text-green-700 text-2xl mt-0.5">{formatCurrency(pay.net_amount ?? pay.amount)}</p>
                </div>
                {pay.payment_reference && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Payment Reference</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{pay.payment_reference}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Bank</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{pay.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Account Number</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{pay.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Account Name</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{pay.account_name}</p>
                </div>
              </div>

              {pay.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-slate-700">{pay.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Documents */}
          {docs && docs.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-700">Payment Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(docs as PaymentDocument[]).map(doc => (
                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all">
                      <FileText className="w-7 h-7 text-green-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700 capitalize truncate">{doc.document_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                      </div>
                      <Download className="w-4 h-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accounts Actions */}
          {p.role === 'head_of_accounts' && ['pending', 'approved'].includes(status) && (
            <PaymentActions payment={pay} profile={p} />
          )}
        </div>

        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700">Contractor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-slate-500">Company:</span> <span className="font-semibold">{pay.contractors?.company_name}</span></p>
              <Separator />
              <p><span className="text-slate-500">Bank:</span> <span className="font-semibold">{pay.contractors?.bank_name}</span></p>
              <p><span className="text-slate-500">Account:</span> <span className="font-semibold">{pay.contractors?.account_number}</span></p>
              <p><span className="text-slate-500">Account Name:</span> <span className="font-semibold">{pay.contractors?.account_name}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
