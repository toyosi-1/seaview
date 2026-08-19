'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BrandPanel } from '@/components/auth/BrandPanel'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <Card className="border border-spl-border shadow-lg lg:shadow-none lg:border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-center text-spl-navy">
                {sent ? 'Email Sent' : 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-center text-base text-spl-text-muted">
                {sent
                  ? 'Check your email for a password reset link.'
                  : 'Enter your email to receive a password reset link.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-spl-success-bg flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-spl-success" />
                  </div>
                  <p className="text-slate-600">
                    A reset link has been sent to <strong>{email}</strong>. Please check your inbox.
                  </p>
                  <Button asChild variant="outline" className="w-full h-12">
                    <a href="/login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium text-slate-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 text-base border-slate-300 focus:border-spl-blue"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                  <Button asChild variant="ghost" className="w-full h-12">
                    <a href="/login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </a>
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
