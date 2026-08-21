'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database, UserRole } from '@/types/database'

export async function createStaffUser(payload: {
  fullName: string | null
  email: string
  password: string
  role: UserRole
}) {
  // Verify the caller is ict_admin using the normal server client
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const p = profile as unknown as { role: UserRole } | null
  if (!p || p.role !== 'ict_admin') return { error: 'Access denied. ICT Admin only.' }

  // Use service role admin client to create user without affecting current session
  const adminClient = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { full_name: payload.fullName ?? '' },
  })
  if (createError) return { error: createError.message }
  if (!newUser.user) return { error: 'Failed to create auth user' }

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: newUser.user.id,
    full_name: payload.fullName,
    email: payload.email,
    role: payload.role,
    is_active: true,
    phone: null,
    department: null,
    signature_url: null,
    avatar_url: null,
  })

  if (profileError) {
    // Rollback: delete the auth user if profile creation failed
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: profileError.message }
  }

  return { success: true, userId: newUser.user.id }
}
