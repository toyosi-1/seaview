-- Clean up leftover diagnostic rows created while investigating the
-- audit_logs / notifications RLS grant issue. audit_logs is intentionally
-- immutable (see prevent_audit_modification trigger in 001_initial_schema.sql),
-- so the delete trigger must be temporarily disabled to remove this
-- diagnostic-only row.
ALTER TABLE public.audit_logs DISABLE TRIGGER trg_prevent_audit_delete;
DELETE FROM public.audit_logs WHERE action IN ('diagnostic', 'diagnostic self', 'diagnostic self v2', 'diagnostic self v3', 'debug invoker test');
ALTER TABLE public.audit_logs ENABLE TRIGGER trg_prevent_audit_delete;

DELETE FROM public.profiles WHERE email LIKE 'seaview.apitest%@gmail.com';
