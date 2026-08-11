-- ============================================================
-- Email notification trigger
-- When a row is inserted into notifications, call the
-- send-email-notification edge function via pg_net (Supabase extension)
-- ============================================================

-- Ensure pg_net extension is available
create extension if not exists pg_net;

-- Function to send email notification via edge function
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

-- Trigger on notifications insert
drop trigger if exists on_notification_inserted on public.notifications;
create trigger on_notification_inserted
  after insert on public.notifications
  for each row
  execute function public.send_email_notification();
