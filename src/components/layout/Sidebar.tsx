'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import type { Profile } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Banknote,
  Bell,
  ScrollText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  ShoppingCart,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[]
}

const STAFF_ROLE_LIST = ['md', 'head_of_procurement', 'head_of_environment', 'head_of_ict', 'head_of_audit', 'head_of_accounts', 'ict_admin', 'contract_officer']

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contractors', label: 'Contractors', icon: Building2, roles: STAFF_ROLE_LIST },
  { href: '/contractor-profile', label: 'My Profile', icon: Building2, roles: ['contractor'] },
  { href: '/tenders', label: 'Available Contracts', icon: Briefcase },
  { href: '/contracts', label: 'Awarded Contracts', icon: FileText },
  { href: '/proposals', label: 'Quotations', icon: ClipboardList },
  { href: '/completions', label: 'Project Completions', icon: ClipboardList },
  { href: '/internal-procurement', label: 'Internal Procurement', icon: ShoppingCart, roles: STAFF_ROLE_LIST },
  { href: '/audit', label: 'Audit Reviews', icon: ShieldCheck, roles: ['head_of_audit', 'md', 'ict_admin'] },
  { href: '/payments', label: 'Payments', icon: Banknote, roles: ['head_of_accounts', 'ict_admin', 'contractor'] },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/audit-log', label: 'Audit Log', icon: ScrollText, roles: ['md', 'ict_admin'] },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['ict_admin'] },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    async function loadUnread() {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.id)
        .eq('is_read', false)
      setUnreadCount(data?.length ?? 0)
    }
    loadUnread()
    const channel = supabase
      .channel(`sidebar-notifs:${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, () => setUnreadCount(c => c + 1))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, () => loadUnread())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile.id])

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(profile.role)
  )

  // Close mobile sidebar on route change
  useEffect(() => {
    // eslint-disable-next-line
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = profile.full_name || ROLE_LABELS[profile.role] || profile.email
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cn(
        'fixed left-0 top-0 h-full bg-spl-blue-dark text-white flex flex-col z-40 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0 p-1">
              <Image src="/brand/spl-logo-mark.png" alt="Seaview Properties Limited" width={52} height={52} priority className="object-contain w-full h-full" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-bold text-white leading-snug">Seaview Properties Limited</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mx-auto p-1">
            <Image src="/brand/spl-logo-mark.png" alt="SPL" width={44} height={44} className="object-contain w-full h-full" />
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors hidden md:flex',
            collapsed && 'mx-auto mt-2'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 md:hidden"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                isActive
                  ? 'bg-spl-blue text-white shadow-sm'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-white' : 'text-blue-200/60 group-hover:text-white')} />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {item.href === '/notifications' && unreadCount > 0 && (
                <span className={cn(
                  'bg-spl-danger text-white text-xs font-bold rounded-sm flex items-center justify-center min-w-[20px] h-5 px-1',
                  collapsed ? 'absolute -top-1 -right-1 w-5 h-5' : 'ml-auto'
                )}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-white/10" />

      {/* User Profile */}
      <div className={cn('p-3', collapsed && 'flex flex-col items-center')}>
        <div className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5',
          collapsed && 'flex-col p-2'
        )}>
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-spl-blue text-white text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-blue-200/60 truncate">{ROLE_LABELS[profile.role]}</p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'mt-2 text-blue-200/60 hover:text-white hover:bg-white/10',
            collapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'
          )}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </Button>
      </div>
    </aside>
    {/* Mobile menu toggle button (fixed, outside sidebar) */}
    {!mobileOpen && (
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-30 md:hidden w-10 h-10 rounded-lg bg-spl-blue-dark text-white flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    )}
    </>
  )
}
