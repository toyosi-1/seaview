'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Search, X, Home } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Profile } from '@/types/database'

interface SearchResult {
  type: string
  id: string
  label: string
  sub: string
  href: string
}

export function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const { notifications, unreadCount, markAllRead } = useNotifications(profile.id)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([])
        setQuery('')
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return }
      setSearching(true)
      const supabase = createClient()
      const q = query.trim()
      const found: SearchResult[] = []

      const [{ data: rawContractors }, { data: rawProposals }, { data: rawContracts }, { data: rawPayments }, { data: rawInternalProcurement }] = await Promise.all([
        supabase.from('contractors').select('id,company_name,cac_number,tin_number').or(`company_name.ilike.%${q}%,cac_number.ilike.%${q}%,tin_number.ilike.%${q}%`).limit(5),
        supabase.from('proposals').select('id,proposal_number,title').or(`proposal_number.ilike.%${q}%,title.ilike.%${q}%`).limit(5),
        supabase.from('contracts').select('id,contract_number,title').ilike('contract_number', `%${q}%`).limit(5),
        supabase.from('payments').select('id,payment_number').ilike('payment_number', `%${q}%`).limit(5),
        supabase.from('internal_procurement_requests').select('id,request_number,item_description').or(`request_number.ilike.%${q}%,item_description.ilike.%${q}%`).limit(5),
      ])

      const contractors = (rawContractors ?? []) as unknown as { id: string; company_name: string; cac_number: string; tin_number: string }[]
      const proposals = (rawProposals ?? []) as unknown as { id: string; title: string; proposal_number: string }[]
      const contracts = (rawContracts ?? []) as unknown as { id: string; title: string; contract_number: string }[]
      const payments = (rawPayments ?? []) as unknown as { id: string; payment_number: string }[]
      const internalProcurement = (rawInternalProcurement ?? []) as unknown as { id: string; request_number: string; item_description: string }[]

      contractors.forEach(c => found.push({ type: 'Contractor', id: c.id, label: c.company_name, sub: `CAC: ${c.cac_number} · TIN: ${c.tin_number}`, href: `/contractors/${c.id}` }))
      proposals.forEach(p => found.push({ type: 'Quotation', id: p.id, label: p.title, sub: p.proposal_number, href: `/proposals/${p.id}` }))
      contracts.forEach(c => found.push({ type: 'Contract', id: c.id, label: c.title, sub: c.contract_number, href: `/contracts/${c.id}` }))
      payments.forEach(p => found.push({ type: 'Payment', id: p.id, label: p.payment_number, sub: 'Payment record', href: `/payments/${p.id}` }))
      internalProcurement.forEach(r => found.push({ type: 'Procurement Request', id: r.id, label: r.item_description, sub: r.request_number, href: `/internal-procurement/${r.id}` }))

      setResults(found)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-30 pl-14 lg:pl-6">
      {/* Home button */}
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center transition-colors">
          <Home className="w-5 h-5" />
        </div>
      </Link>
      {/* Search - hidden on mobile */}
      <div className="flex-1 max-w-xl relative hidden md:block" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search contractors, proposals, contracts, payments..."
            className="pl-9 pr-9 h-10 bg-slate-50 border-slate-200 text-sm"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        {(results.length > 0 || (searching && query.length >= 2)) && (
          <div className="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            {searching && (
              <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
            )}
            {!searching && results.length === 0 && query.length >= 2 && (
              <div className="px-4 py-3 text-sm text-slate-500">No results found</div>
            )}
            {results.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => { router.push(r.href); setResults([]); setQuery('') }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 text-left"
              >
                <Badge variant="outline" className="text-xs shrink-0">{r.type}</Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.label}</p>
                  <p className="text-xs text-slate-500 truncate">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications && unreadCount > 0) markAllRead() }}
          className="relative w-10 h-10 p-0"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-[480px] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <Link href="/notifications" className="text-xs text-blue-600 hover:text-blue-800">View all</Link>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">No notifications yet</div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  )
}
