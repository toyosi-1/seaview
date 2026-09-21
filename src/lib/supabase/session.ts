import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Contractor, Profile } from '@/types/database'

/**
 * Request-scoped, deduplicated fetch of the current user + profile.
 *
 * The root portal layout and every page under it each independently
 * called `supabase.auth.getUser()` (a network round-trip to Supabase Auth)
 * followed by a `profiles` table lookup. Since layouts and pages both
 * render on every navigation, this doubled the auth/profile latency on
 * every single page transition.
 *
 * Wrapping this in React's `cache()` means all calls within the same
 * server request (layout + page) share a single result, cutting that
 * latency in half for every navigation.
 *
 * For contractors, the company name is fetched in the same round-trip
 * as the profile so the layout doesn't need a separate query.
 *
 * Performance: uses `getSession()` (reads JWT from cookie, zero network
 * calls) instead of `getUser()` (network call to Supabase Auth). The
 * middleware already verifies the session with `getUser()` on every
 * request, so reading the cookie here is safe — RLS policies still
 * protect all data. The profile and contractor queries run in parallel
 * instead of sequentially, reducing total round-trips from 3 to 1.
 */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient()

  // getSession() reads the JWT from the cookie — no network call.
  // The middleware already verified the session with getUser().
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    return { supabase, user: null, profile: null, contractorCompanyName: null, contractorId: null, contractorStatus: null }
  }

  // Fetch profile and contractor in parallel — the contractor query
  // returns null for non-contractors, so it's a no-op that doesn't
  // add latency (runs concurrently with the profile query).
  const [{ data: profile }, { data: contractor }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('contractors')
      .select('id,company_name,status')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const p = (profile ?? null) as Profile | null
  const c = contractor as Pick<Contractor, 'id' | 'company_name' | 'status'> | null

  return {
    supabase,
    user,
    profile: p,
    contractorCompanyName: c?.company_name ?? null,
    contractorId: c?.id ?? null,
    contractorStatus: c?.status ?? null,
  }
})
