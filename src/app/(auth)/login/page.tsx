'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { BrandPanel } from '@/components/auth/BrandPanel'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-spl-blue" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'account_deactivated') {
      toast.error('Your account has been deactivated. Please contact ICT Administration.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-md space-y-6">
          <div className="hidden md:block space-y-1">
            <h2 className="text-3xl font-bold text-spl-navy">Sign In</h2>
            <p className="text-spl-text-muted text-base">Enter your credentials to access the portal</p>
          </div>

          <Card className="border border-spl-border shadow-lg md:shadow-none md:border-0 bg-white">
            <CardHeader className="space-y-1 pb-4 md:hidden !px-8 sm:!px-10">
              <CardTitle className="text-2xl font-bold text-center text-spl-navy">Sign In</CardTitle>
              <CardDescription className="text-center text-spl-text-muted text-base">
                Enter your credentials to access the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="!px-8 sm:!px-10">
              <form onSubmit={handleLogin} className="space-y-5">
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
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="h-12 text-base border-slate-300 focus:border-spl-blue pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="/forgot-password" className="text-sm text-spl-blue hover:text-spl-blue-dark font-medium">
                    Forgot your password?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500">
                  New contractor?{' '}
                  <a href="/register" className="text-spl-blue hover:text-spl-blue-dark font-semibold">
                    Register your company
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-slate-400 text-xs">
            © {new Date().getFullYear()} Seaview Properties Limited. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
