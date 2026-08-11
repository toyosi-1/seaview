'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Building2, Loader2, Save } from 'lucide-react'
import type { Contractor } from '@/types/database'

export function ContractorEditForm({ contractor }: { contractor: Contractor }) {
  const [companyName, setCompanyName] = useState(contractor.company_name)
  const [cacNumber, setCacNumber] = useState(contractor.cac_number ?? '')
  const [tinNumber, setTinNumber] = useState(contractor.tin_number ?? '')
  const [phone, setPhone] = useState(contractor.phone ?? '')
  const [address, setAddress] = useState(contractor.address ?? '')
  const [bankName, setBankName] = useState(contractor.bank_name ?? '')
  const [accountNumber, setAccountNumber] = useState(contractor.account_number ?? '')
  const [accountName, setAccountName] = useState(contractor.account_name ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      toast.error('Company name is required')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('contractors').update({
        company_name: companyName.trim(),
        cac_number: cacNumber.trim() || null,
        tin_number: tinNumber.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        bank_name: bankName.trim() || null,
        account_number: accountNumber.trim() || null,
        account_name: accountName.trim() || null,
      } as never).eq('id', contractor.id)
      if (error) throw error
      toast.success('Company profile updated successfully')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label className="font-medium">Company Name *</Label>
        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-11" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-medium">CAC Number</Label>
          <Input value={cacNumber} onChange={e => setCacNumber(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label className="font-medium">TIN Number</Label>
          <Input value={tinNumber} onChange={e => setTinNumber(e.target.value)} className="h-11" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-medium">Phone Number</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-11" />
      </div>
      <div className="space-y-2">
        <Label className="font-medium">Address</Label>
        <Textarea value={address} onChange={e => setAddress(e.target.value)} className="min-h-[70px] resize-none" />
      </div>
      <div className="pt-2 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-600 mb-3">Banking Details</p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="font-medium">Bank Name</Label>
            <Input value={bankName} onChange={e => setBankName(e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Account Number</Label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Account Name</Label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} className="h-11" />
            </div>
          </div>
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading || !companyName.trim()}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
          : <><Save className="w-4 h-4 mr-2" />Save Company Profile</>}
      </Button>
    </form>
  )
}
