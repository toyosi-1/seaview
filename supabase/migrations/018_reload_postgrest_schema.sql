-- Force PostgREST to reload its schema/policy cache. Migrations applied
-- via direct CLI/psql connection don't always trigger PostgREST's
-- automatic schema cache refresh, which can cause newly added policies to
-- not take effect until this notification (or a project restart) happens.
NOTIFY pgrst, 'reload schema';
