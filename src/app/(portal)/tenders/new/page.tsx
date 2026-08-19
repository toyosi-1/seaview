'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Briefcase, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { logAudit } from '@/lib/utils/notify'

export default function NewTenderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [closingDate, setClosingDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: tenderRaw, error } = await supabase
        .from('tenders')
        .insert({
          title: title.trim(),
          description: description.trim(),
          requirements: requirements.trim() || null,
          closing_date: closingDate ? new Date(closingDate).toISOString() : null,
          status: 'open',
          posted_by: user.id,
          contract_number: '',
        } as never)
        .select()
        .single()

      if (error) throw error
      const tender = tenderRaw as unknown as { id: string; contract_number: string }

      await logAudit({
        userId: user.id,
        userRole: 'contract_officer',
        action: 'Tender posted',
        entityType: 'tender',
        entityId: tender.id,
        newStatus: 'open',
      })

      toast.success(`Contract posted successfully! Contract Number: ${tender.contract_number}`)
      router.push(`/tenders/${tender.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post contract')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-500">
          <Link href="/tenders">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Post New Contract</h1>
          <p className="text-slate-500 mt-0.5">Fill in the contract details below to make it available to contractors</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Contract Details</CardTitle>
            <CardDescription>Provide a clear and detailed description of the contract</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Contract Title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Construction of Warehouse Facility"
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Description *</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the contract scope, deliverables, and expectations..."
                className="min-h-[140px] text-base resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Closing Date</Label>
              <Input
                type="date"
                value={closingDate}
                onChange={e => setClosingDate(e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-xs text-slate-500">Leave blank if open-ended</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Requirements (Optional)</CardTitle>
            <CardDescription>List any specific requirements, qualifications, or documentation needed from contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              placeholder="e.g. Must have CAC registration, minimum 5 years experience, evidence of similar projects..."
              className="min-h-[100px] text-base resize-none"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4 pb-8">
          <Button asChild variant="outline" size="lg" className="flex-1 h-12 text-base">
            <Link href="/tenders">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading || !title || !description}
            size="lg"
            className="flex-1 h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Posting...</>
            ) : (
              <><Briefcase className="w-5 h-5 mr-2" />Post Contract</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
