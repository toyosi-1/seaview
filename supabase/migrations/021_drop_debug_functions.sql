-- Remove temporary diagnostic functions used to debug the audit_logs /
-- notifications RLS investigation. No longer needed.
DROP FUNCTION IF EXISTS public.debug_list_policies(text);
DROP FUNCTION IF EXISTS public.debug_test_insert_audit(uuid);
