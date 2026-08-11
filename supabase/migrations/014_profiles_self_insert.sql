-- Allow a newly signed-up user to insert their own profile row during
-- contractor self-registration. Previously there was no INSERT policy on
-- public.profiles, so RLS silently blocked the insert performed by the
-- registration flow, causing "Registration failed" with no clear reason.

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());
