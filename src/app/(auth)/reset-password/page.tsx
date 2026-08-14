'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { BrandPanel } from '@/components/auth/BrandPanel'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-spl-navy" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      toast.success('Password reset successfully')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Compact mobile brand header */}
        <div className="lg:hidden text-center mb-6 mt-4">
          <div className="w-20 h-20 rounded-full bg-white shadow-lg ring-1 ring-spl-border flex items-center justify-center p-2.5 mx-auto">
            <Image src="/brand/spl-logo-mark.png" alt="Seaview Properties Limited" width={72} height={72} className="object-contain w-full h-full" />
          </div>
          <p className="mt-3 text-sm text-spl-text-muted">Seaview Properties Limited</p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <Card className="border border-spl-border shadow-lg lg:shadow-none lg:border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-center text-spl-navy">
                {done ? 'Password Reset' : 'Set New Password'}
              </CardTitle>
              <CardDescription className="text-center text-base text-spl-text-muted">
                {done ? 'Your password has been updated.' : 'Enter your new password below.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-spl-success-bg flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-spl-success" />
                  </div>
                  <p className="text-slate-600">Redirecting you to login...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-medium text-slate-700">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className="h-12 text-base border-slate-300 focus:border-spl-blue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-base font-medium text-slate-700">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="h-12 text-base border-slate-300 focus:border-spl-blue"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="w-full h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" />Reset Password</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
