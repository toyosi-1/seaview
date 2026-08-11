-- Temporary diagnostic function to verify RLS policy state directly.
-- Will be dropped once the audit_logs / notifications insert issue is
-- resolved.
CREATE OR REPLACE FUNCTION public.debug_list_policies(p_table text)
RETURNS TABLE(policyname text, cmd text, permissive text, roles text, qual text, with_check text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT policyname, cmd, permissive, roles::text, qual, with_check
  FROM pg_policies
  WHERE tablename = p_table AND schemaname = 'public';
$$;

GRANT EXECUTE ON FUNCTION public.debug_list_policies(text) TO authenticated, anon;
