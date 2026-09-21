import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/session'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import type { Profile } from '@/types/database'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { supabase, user, profile, contractorCompanyName, contractorId } = await getSessionProfile()

  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  // Deactivated users are blocked here rather than in middleware, since
  // getSessionProfile already fetches the full profile — no extra round-trip.
  if (!(profile as Profile).is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=account_deactivated')
  }

  return (
    <ProfileProvider
      initialFullName={(profile as Profile).full_name}
      initialContractorCompanyName={contractorCompanyName}
    >
      <NotificationsProvider userId={user.id}>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar profile={profile as Profile} />
          <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
            <TopBar profile={profile as Profile} contractorId={contractorId} />
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </NotificationsProvider>
    </ProfileProvider>
  )
}
