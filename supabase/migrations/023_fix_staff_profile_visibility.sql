-- profiles_select_staff only checks the CALLER's role (must already be
-- staff), never the TARGET row's role. This means a contractor can never
-- see staff profiles at all, which breaks src/lib/utils/notify.ts's
-- getStaffByRole()/getStaffUserIds() helpers whenever they're invoked from
-- a contractor session (e.g. notifying MD after a quotation is submitted,
-- or notifying a project supervisor after a completion report). Those
-- lookups silently return an empty list, so the notification is never
-- created even though the notifications table itself now accepts inserts.
--
-- Fix: allow any authenticated user to see profiles that are NOT
-- contractors (i.e. internal staff), matching how getStaffByRole/
-- getStaffUserIds already filter with .neq('role','contractor'). Staff
-- profiles were already fully visible to every other staff member via the
-- existing profiles_select_staff policy, so this does not expose any new
-- data to staff — it only extends the same staff-profile visibility to
-- contractors, who still cannot see other contractors' profiles.
CREATE POLICY "profiles_select_staff_visible_to_all" ON public.profiles
FOR SELECT USING (role != 'contractor');
