-- Supabase's security model relies on broad table-level GRANTs to anon,
-- authenticated, and service_role, with Row Level Security policies doing
-- the actual access restriction. This project never had those default
-- grants applied (likely because migrations were run via direct psql/CLI
-- rather than the Supabase dashboard, which normally sets this up
-- automatically at project creation).
--
-- Without these grants, every table operation from client-side code
-- (using the anon/authenticated key) fails with "permission denied for
-- table ..." regardless of whether RLS policies are correctly defined.
-- This was silently masked in several places (e.g. notify()/logAudit() in
-- src/lib/utils/notify.ts) by try/catch blocks treating failures as
-- "best-effort", so audit logs and notifications have never actually been
-- written despite the app appearing to function normally.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
