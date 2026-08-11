-- proposal_timeline is designed as "internal staff only" (see
-- proposal_timeline_staff_only policy), but src/app/(portal)/proposals/new/page.tsx
-- has contractors insert their own "submitted" timeline entry right after
-- creating a proposal. That insert has always failed RLS for contractors.
--
-- Allow a contractor to insert a timeline entry only for a proposal they
-- own; staff retain their existing full (FOR ALL) access via
-- proposal_timeline_staff_only.
CREATE POLICY "proposal_timeline_contractor_insert_own" ON public.proposal_timeline
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.contractors c ON c.id = p.contractor_id
    WHERE p.id = proposal_id AND c.user_id = auth.uid()
  )
);
