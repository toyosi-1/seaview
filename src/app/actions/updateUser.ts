'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database, UserRole } from '@/types/database'

export async function updateUser(payload: {
  userId: string
  fullName?: string | null
  email?: string
  role?: UserRole
  department?: string
  phone?: string
  isActive?: boolean
}) {
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const p = profile as unknown as { role: UserRole } | null
  if (!p || p.role !== 'ict_admin') return { error: 'Access denied. ICT Admin only.' }

  const adminClient = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const update: Record<string, unknown> = {}
  if (payload.fullName !== undefined) update.full_name = payload.fullName
  if (payload.email !== undefined) update.email = payload.email
  if (payload.role !== undefined) update.role = payload.role
  if (payload.department !== undefined) update.department = payload.department || null
  if (payload.phone !== undefined) update.phone = payload.phone || null
  if (payload.isActive !== undefined) update.is_active = payload.isActive

  const { error: profileError } = await adminClient
    .from('profiles')
    .update(update as never)
    .eq('id', payload.userId)

  if (profileError) return { error: profileError.message }

  if (payload.email) {
    await adminClient.auth.admin.updateUserById(payload.userId, {
      email: payload.email,
    })
  }

  return { success: true }
}
