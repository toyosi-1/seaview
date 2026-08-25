import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Supabase calls in middleware run on every navigation. If Supabase is
// briefly slow or unreachable (e.g. a free-tier project waking from idle),
// an unhandled hang/rejection here crashes the whole Edge Function and the
// user sees a hard "Edge Function error" with no page ever loading. This
// timeout ensures we always fail open (let the request through) instead.
const SUPABASE_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Supabase middleware timeout')), ms)),
  ])
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/api/register']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  try {
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), SUPABASE_TIMEOUT_MS)

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Deactivated users are blocked — enforced in the portal layout (which
    // already fetches the full profile via getSessionProfile) rather than
    // here, to avoid a second Supabase round-trip on every navigation.

    if (user && pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    // Fail open: if Supabase is slow/unreachable, don't crash navigation.
    // Protected pages still enforce auth server-side via getSessionProfile.
    console.error('Middleware auth check failed, letting request through:', err)
  }

  return supabaseResponse
}
