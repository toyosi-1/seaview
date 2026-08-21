import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/session'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import type { Profile } from '@/types/database'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getSessionProfile()

  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar profile={profile as Profile} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <TopBar profile={profile as Profile} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
