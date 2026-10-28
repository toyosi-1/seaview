import { Suspense } from 'react'
import { getSessionProfile } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, AlertTriangle } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import { DashboardContent } from './DashboardContent'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import type { Profile, UserRole } from '@/types/database'

export default async function DashboardPage() {
  const { user, profile, contractorStatus } = await getSessionProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  const p = profile as Profile
  const isContractor = p.role === 'contractor'
  const isSuspended = isContractor && contractorStatus === 'suspended'

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Greeting — renders immediately, independent of the data fetches below */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 break-words">
            {greeting()}, {p.full_name?.split(' ')[0] ?? ROLE_LABELS[p.role as UserRole]}
          </h1>
          <p className="text-spl-text-muted text-sm sm:text-base mt-2">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isContractor && !isSuspended && (
          <Button asChild size="lg" className="bg-spl-blue hover:bg-spl-blue-dark text-white h-11 w-full sm:w-auto px-4 sm:px-6 text-sm font-semibold">
            <Link href="/tenders">
              <Briefcase className="w-5 h-5 mr-2" />
              Browse Available Contracts
            </Link>
          </Button>
        )}
      </div>

      {isSuspended && (
        <div className="flex items-start gap-3 bg-spl-danger-bg border border-red-200 rounded-xl px-6 py-4">
          <AlertTriangle className="w-5 h-5 text-spl-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-spl-danger">Account Suspended</p>
            <p className="text-sm text-spl-danger/80 mt-1">
              Your contractor account has been suspended. You cannot submit new quotations, completion reports, or resubmit pending items. Please contact Seaview Properties Limited for assistance.
            </p>
          </div>
        </div>
      )}

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
