-- ============================================================
-- Configure email notification trigger
-- Reads edge function URL and service role key from GUC settings
-- Run after deploying: set via Supabase SQL Editor:
--   alter database postgres set app.supabase_edge_url to 'https://bwdbxtnzmrzfbonbpikv.supabase.co/functions/v1/send-email-notification';
--   alter database postgres set app.supabase_service_key to '<your-service-role-key>';
-- ============================================================

create or replace function public.send_email_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_url text;
  service_key text;
begin
  edge_url := current_setting('app.supabase_edge_url', true);
  service_key := current_setting('app.supabase_service_key', true);

  if edge_url is null or service_key is null then
    -- Settings not configured — skip silently
    return new;
  end if;

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
