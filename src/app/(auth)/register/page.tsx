'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BrandPanel } from '@/components/auth/BrandPanel'

const STEPS = ['Account', 'Company', 'Banking']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Company
  const [companyName, setCompanyName] = useState('')
  const [cacNumber, setCacNumber] = useState('')
  const [tinNumber, setTinNumber] = useState('')

  // Banking
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')


  function validateStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!email.trim()) return 'Please enter your email address'
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address'
      if (!password || password.length < 8) return 'Password must be at least 8 characters'
    }
    if (currentStep === 1) {
      if (!companyName.trim()) return 'Please enter your company name'
      if (!cacNumber.trim()) return 'Please enter your CAC registration number'
      if (!tinNumber.trim()) return 'Please enter your TIN number'
    }
    if (currentStep === 2) {
      if (!bankName.trim()) return 'Please enter your bank name'
      if (!accountNumber.trim()) return 'Please enter your account number'
      if (!accountName.trim()) return 'Please enter your account name'
    }
    return null
  }

  function handleNext() {
    const error = validateStep(step)
    if (error) {
      toast.error(error)
      return
    }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    const error = validateStep(step)
    if (error) {
      toast.error(error)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          companyName,
          cacNumber,
          tinNumber,
          bankName,
          accountNumber,
          accountName,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Registration failed')

      toast.success('Registration successful! You can now log in.')
      router.push('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-spl-navy">Contractor Registration</h1>
            <p className="text-spl-text-muted text-sm">Register your company to bid on SPL contracts</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${i < step ? 'bg-spl-success text-white' : i === step ? 'bg-spl-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-spl-navy font-medium' : 'text-slate-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-spl-success' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

        <Card className="border border-spl-border shadow-lg bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-spl-navy">
              Step {step + 1}: {STEPS[step]}
            </CardTitle>
            <CardDescription>
              {step === 0 && 'Create your login credentials'}
              {step === 1 && 'Enter your company details'}
              {step === 2 && 'Provide your bank information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Email Address *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Password *</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" className="h-11" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Company Name *</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ABC Engineering Ltd" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">CAC Registration Number *</Label>
                  <Input value={cacNumber} onChange={e => setCacNumber(e.target.value)} placeholder="RC123456" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">TIN Number *</Label>
                  <Input value={tinNumber} onChange={e => setTinNumber(e.target.value)} placeholder="12345678-0001" className="h-11" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Bank Name *</Label>
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="First Bank of Nigeria" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Account Number *</Label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="0123456789" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Account Name *</Label>
                  <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="ABC Engineering Ltd" className="h-11" />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-11 bg-spl-blue hover:bg-spl-blue-dark text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-11 bg-spl-success hover:bg-green-700 text-white"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              Already registered?{' '}
              <a href="/login" className="text-spl-blue hover:text-spl-blue-dark font-medium">Sign in</a>
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
