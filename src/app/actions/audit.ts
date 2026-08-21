'use server'

import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

interface AuditEntry {
  userId: string
  userRole: UserRole
  action: string
  entityType: string
  entityId?: string
  previousStatus?: string
  newStatus?: string
  details?: Record<string, unknown>
}

export async function logAuditAction(entry: AuditEntry) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    user_id: entry.userId,
    user_role: entry.userRole,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    previous_status: entry.previousStatus ?? null,
    new_status: entry.newStatus ?? null,
    details: entry.details ?? null,
    ip_address: null,
    user_agent: null,
  })
}
