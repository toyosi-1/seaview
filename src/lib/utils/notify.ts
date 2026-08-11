import { createClient } from '@/lib/supabase/client'
import type { NotificationType, UserRole } from '@/types/database'

interface NotifyParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  referenceId?: string
  referenceType?: string
}

export async function notify(params: NotifyParams) {
  try {
    const supabase = createClient()
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      reference_id: params.referenceId ?? null,
      reference_type: params.referenceType ?? null,
    } as never)
  } catch {
    // Non-blocking — notifications are best-effort
  }
}

export async function notifyMany(params: NotifyParams[]) {
  await Promise.all(params.map(notify))
}

interface AuditParams {
  userId: string
  userRole: UserRole
  action: string
  entityType: string
  entityId?: string
  previousStatus?: string
  newStatus?: string
}

export async function logAudit(params: AuditParams) {
  try {
    const supabase = createClient()
    await supabase.from('audit_logs').insert({
      user_id: params.userId,
      user_role: params.userRole,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      previous_status: params.previousStatus ?? null,
      new_status: params.newStatus ?? null,
    } as never)
  } catch {
    // Non-blocking — audit logs are best-effort
  }
}

export async function getStaffUserIds(): Promise<{ id: string; role: string; full_name: string }[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id,role,full_name')
      .neq('role', 'contractor')
      .eq('is_active', true)
    return (data ?? []) as unknown as { id: string; role: string; full_name: string }[]
  } catch {
    return []
  }
}

export async function getStaffByRole(role: string): Promise<{ id: string; full_name: string }[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id,full_name')
      .eq('role', role)
      .eq('is_active', true)
    return (data ?? []) as unknown as { id: string; full_name: string }[]
  } catch {
    return []
  }
}
