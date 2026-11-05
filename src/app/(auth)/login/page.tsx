'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex-1 flex flex-col bg-spl-bg">
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-[420px]">
            <div className="bg-white border border-spl-border shadow-[0_1px_3px_rgba(18,48,71,0.06)]">
              <div className="h-[3px] w-full bg-spl-blue" />
              <div className="px-7 sm:px-9 py-8 sm:py-9">
                <div className="mb-7">
                  <h2 className="text-[22px] font-bold text-spl-navy tracking-tight">Sign in to your account</h2>
                  <p className="text-sm text-spl-text-muted mt-1.5">Authorized personnel and registered contractors only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[13px] font-medium text-slate-600">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="h-11 text-[15px] border-slate-300 rounded-md focus-visible:border-spl-blue"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[13px] font-medium text-slate-600">
                        Password
                      </Label>
                      <a href="/forgot-password" className="text-[13px] text-spl-blue hover:text-spl-blue-dark font-medium">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Your password"
                        required
                        autoComplete="current-password"
                        className="h-11 text-[15px] border-slate-300 rounded-md focus-visible:border-spl-blue pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-[15px] font-semibold bg-spl-blue hover:bg-spl-blue-dark text-white rounded-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-7 pt-5 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-500">
                    New contractor?{' '}
                    <a href="/register" className="text-spl-blue hover:text-spl-blue-dark font-semibold">
                      Register your company
                    </a>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Corporate footer */}
        <footer className="border-t border-spl-border px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[12px] text-slate-400">
            <p>© {new Date().getFullYear()} Seaview Properties Limited. All rights reserved.</p>
            <p>A subsidiary of the Nigerian Ports Authority</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
