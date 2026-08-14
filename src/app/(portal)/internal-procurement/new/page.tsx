'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ArrowLeft, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/lib/constants'
import type { Department } from '@/types/database'
import { notify, notifyMany, logAudit, getStaffByRole } from '@/lib/utils/notify'

export default function NewInternalProcurementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [department, setDepartment] = useState<Department | ''>('')
  const [itemDescription, setItemDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [reason, setReason] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!department) { toast.error('Select a department'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('internal_procurement_requests').insert({
        department,
        requested_by: user.id,
        item_description: itemDescription.trim(),
        quantity: Number(quantity) || 1,
        estimated_cost: Number(estimatedCost) || 0,
        reason: reason.trim(),
        status: 'submitted',
      } as never).select().single()
      if (error) throw error
      const created = data as unknown as { id: string }

      // Audit log
      await logAudit({
        userId: user.id,
        userRole: 'contractor',
        action: 'Internal procurement request submitted',
        entityType: 'internal_procurement_request',
        entityId: created.id,
        newStatus: 'submitted',
      })

      // Notify MD
      const mdStaff = await getStaffByRole('md')
      await notifyMany(mdStaff.map(s => ({
        userId: s.id,
        type: 'proposal_submitted',
        title: 'New Procurement Request',
        message: `A new procurement request "${itemDescription.trim()}" has been submitted.`,
        referenceId: created.id,
        referenceType: 'internal_procurement',
      })))

      toast.success('Procurement request submitted successfully!')
      router.push(`/internal-procurement/${created.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/internal-procurement"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">New Procurement Request</h1>
          <p className="text-slate-500 mt-0.5">Request items or services for your department</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Request Details</CardTitle>
            <CardDescription>This will be reviewed by the MD, then the Procurement Department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-medium">Department *</Label>
              <Select value={department} onValueChange={v => setDepartment(v as Department)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">Item / Service Description *</Label>
              <Textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="e.g. 5 units of office desktop computers" className="min-h-[90px] text-base resize-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Quantity *</Label>
                <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="h-12 text-base" required />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Estimated Cost (₦) *</Label>
                <Input type="number" min={0} step="0.01" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} className="h-12 text-base" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">Justification / Reason *</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this purchase is needed..." className="min-h-[100px] text-base resize-none" required />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pb-8">
          <Button asChild variant="outline" size="lg" className="flex-1 h-12 text-base">
            <Link href="/internal-procurement">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !department || !itemDescription || !estimatedCost || !reason} size="lg" className="flex-1 h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white">
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : <><ShoppingCart className="w-5 h-5 mr-2" />Submit Request</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
