-- audit_logs had NO insert policy at all, so logAudit() calls from
-- src/lib/utils/notify.ts always failed RLS and were silently swallowed.
-- Audit entries mostly record the acting user's own id, but at least one
-- call site (contractor activation/suspension) records the *contractor's*
-- id even though a staff member performs the action. Since this is an
-- append-only audit trail and access control already happens at the app
-- layer (only specific action handlers call logAudit), allow any
-- authenticated user to insert.
CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- notifications previously only allowed FOR ALL USING (user_id = auth.uid()),
-- which (for INSERT) requires the recipient to be the same as the inserting
-- user. But every real call site notifies a *different* user (e.g. staff
-- notifying a contractor, or vice versa), so notify() always failed RLS and
-- was silently swallowed. Allow any authenticated user to create a
-- notification for any recipient; recipients can still only read/update
-- their own notifications via the existing "notifications_own" policy.
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);
