-- ============================================================
-- Configure email notification trigger with hardcoded values
-- (ALTER DATABASE SET not available to postgres role)
-- ============================================================

create or replace function public.send_email_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_url text := 'https://bwdbxtnzmrzfbonbpikv.supabase.co/functions/v1/send-email-notification';
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZGJ4dG56bXJ6ZmJvbmJwaWt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM0MDQ3MCwiZXhwIjoyMTAwOTE2NDcwfQ.r3avTXou1eS2jQzFCipeS4v2b5EF8zZ8mx2sxZch3Fs';
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
