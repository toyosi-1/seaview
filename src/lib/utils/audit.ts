// Audit logging is handled server-side via /app/actions/audit.ts
// This file re-exports for convenience
export { logAuditAction as logAudit } from '@/app/actions/audit'
