'use client'

import { useState, useEffect, Suspense } from 'react'
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
    <Suspense fallback={<div className="min-h-screen bg-spl-blue" />}>
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
  const [exchanging, setExchanging] = useState(true)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.push('/forgot-password')
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        toast.error('Invalid or expired reset link. Please request a new one.')
        setTimeout(() => router.push('/forgot-password'), 2000)
      }
      setExchanging(false)
    })
  }, [searchParams, router])

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
      if (exchanging) throw new Error('Please wait while we verify your reset link')
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <Card className="border border-spl-border shadow-lg md:shadow-none md:border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-center text-spl-navy">
                {done ? 'Password Reset' : 'Set New Password'}
              </CardTitle>
              <CardDescription className="text-center text-base text-spl-text-muted">
                {done ? 'Your password has been updated.' : 'Enter your new password below.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              {done ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-sm bg-spl-success-bg flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-spl-success" />
                  </div>
                  <p className="text-slate-600">Redirecting you to login...</p>
                </div>
              ) : exchanging ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-spl-blue mb-3" />
                  <p className="text-slate-600">Verifying your reset link...</p>
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
