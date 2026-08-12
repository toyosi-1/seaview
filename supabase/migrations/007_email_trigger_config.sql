-- ============================================================
-- Configure email notification trigger
-- NOTE: The service role key must be set in the live database.
-- Supabase does not allow ALTER DATABASE SET via the CLI login
-- role, so this function hardcodes the edge URL and service key.
-- After rotating your service role key, update this function via
-- the Supabase SQL Editor with the new key value.
-- ============================================================

create or replace function public.send_email_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  edge_url text := 'https://bwdbxtnzmrzfbonbpikv.supabase.co/functions/v1/send-email-notification';
  service_key text := '<SUPABASE_SERVICE_ROLE_KEY>';
begin
  perform net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'type', new.type,
      'title', new.title,
      'message', new.message
    )
  );

  return new;
end;
$$;
