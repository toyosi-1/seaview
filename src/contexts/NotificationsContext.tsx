'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

/**
 * Single source of truth for notifications, shared by the Sidebar badge and
 * the TopBar bell dropdown.
 *
 * Previously, Sidebar and TopBar each ran their own independent fetch +
 * realtime subscription against the same `notifications` table. Marking
 * notifications as read in one place (e.g. the TopBar bell, or the
 * server-rendered /notifications page) only updated that component's local
 * state — the other component stayed stale until/unless a realtime UPDATE
 * event happened to fire, which is not reliable for bulk row updates.
 *
 * By lifting this state into a single provider that both components consume,
 * `markAllRead()` and the realtime subscription update one shared state,
 * so the badge and the dropdown are always in sync.
 */
async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data as Notification[]) ?? []
}

export function NotificationsProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Derive unreadCount from notifications so it's always in sync —
  // no separate state that can drift out of sync during realtime events.
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Exposed for external callers (e.g. a manual "refresh" button in the
  // future). Not called directly inside a useEffect body below — each
  // effect declares its own local fetch closure instead, since eslint's
  // react-hooks/set-state-in-effect rule flags effects that synchronously
  // invoke a shared, named state-setting callback.
  const refresh = useCallback(async () => {
    const rows = await fetchNotifications(userId)
    setNotifications(rows)
  }, [userId])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function load() {
      const rows = await fetchNotifications(userId)
      if (cancelled) return
      // If the user landed directly on /notifications, the server page has
      // already marked every row as read. The realtime UPDATE events that
      // broadcast those changes can be missed, so normalise the fetched
      // state to is_read: true when on this page.
      const onNotifications = pathnameRef.current === '/notifications'
      setNotifications(onNotifications ? rows.map(n => ({ ...n, is_read: true })) : rows)
    }
    load()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        const inserted = payload.new as Notification
        // If the user is currently viewing the notifications page, mark the
        // new notification as read immediately so the badge does not reappear.
        if (pathnameRef.current === '/notifications') {
          const read = { ...inserted, is_read: true }
          setNotifications(prev => [read, ...prev])
          supabase.from('notifications').update({ is_read: true }).eq('id', inserted.id).eq('is_read', false).then()
        } else {
          setNotifications(prev => [inserted, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        // Update the specific notification from the payload instead of
        // refetching everything. A bulk UPDATE (e.g. markAllRead) fires
        // many UPDATE events; refetching on each one races with the bulk
        // commit and can return stale is_read: false rows, causing the
        // badge to flicker back. Using the payload is race-free.
        const updated = payload.new as Notification
        setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
      })
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [userId])

  // The layout (and this provider) persists across client-side navigations.
  // The /notifications page marks all notifications as read server-side.
  // Optimistically clear the badge when the user lands on /notifications so
  // it disappears instantly. We intentionally do NOT refetch here — doing so
  // races with the server page's UPDATE (mark all read): the client-side
  // SELECT can return stale is_read: false rows before the server UPDATE
  // commits, causing the badge to flicker back. The optimistic update plus
  // realtime UPDATE events are sufficient to keep the state in sync.
  useEffect(() => {
    if (pathname !== '/notifications') return
    async function clearBadge() {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
    clearBadge()
  }, [pathname])

  const markAllRead = useCallback(async () => {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    if (error) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [userId])

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllRead, refresh }),
    [notifications, unreadCount, markAllRead, refresh]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotificationsContext must be used within a NotificationsProvider')
  return ctx
}
