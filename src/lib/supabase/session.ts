import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

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
 */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { supabase, user, profile: (profile ?? null) as Profile | null }
})
