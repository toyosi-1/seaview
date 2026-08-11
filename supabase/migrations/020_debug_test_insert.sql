-- Temporary diagnostic function (SECURITY INVOKER) to test raw insert
-- behavior under the caller's actual role/RLS context, bypassing any
-- PostgREST-layer quirks.
CREATE OR REPLACE FUNCTION public.debug_test_insert_audit(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_role text;
BEGIN
  SELECT current_setting('request.jwt.claims', true)::json->>'role' INTO v_role;
  INSERT INTO public.audit_logs (user_id, user_role, action)
  VALUES (p_user_id, 'contractor', 'debug invoker test');
  RETURN 'OK as role=' || coalesce(v_role, current_user::text);
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM || ' | current_user=' || current_user::text || ' | jwt_role=' || coalesce(v_role, 'null');
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_test_insert_audit(uuid) TO authenticated;
