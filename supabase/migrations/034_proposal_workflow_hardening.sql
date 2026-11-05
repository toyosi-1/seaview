-- ============================================================
-- Proposal workflow hardening
--
-- 1. proposals_contractor_own (FOR ALL) let a contractor UPDATE
--    any field on their own proposal — including setting
--    status='approved' themselves — and DELETE it. Restrict
--    contractors to SELECT/INSERT freely, and UPDATE only while
--    a quotation is 'returned' for clarification, only back to
--    the stage it was returned from (status = current_stage,
--    which ResubmitProposal restores verbatim).
-- 2. proposal_comments was staff-only (FOR ALL), so the
--    contractor clarification comment written by
--    ResubmitProposal silently failed RLS. Allow contractors to
--    INSERT comments on their own proposals (they still cannot
--    SELECT staff comments).
-- ============================================================

DROP POLICY IF EXISTS "proposals_contractor_own" ON public.proposals;

CREATE POLICY "proposals_contractor_select" ON public.proposals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);

CREATE POLICY "proposals_contractor_insert" ON public.proposals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);

CREATE POLICY "proposals_contractor_update" ON public.proposals FOR UPDATE USING (
  status = 'returned' AND EXISTS (
    SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid()
  )
) WITH CHECK (
  status::text = current_stage AND EXISTS (
    SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid()
  )
);

-- No DELETE policy: contractors cannot delete submitted quotations.

CREATE POLICY "proposal_comments_contractor_insert_own" ON public.proposal_comments
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.contractors c ON c.id = p.contractor_id
    WHERE p.id = proposal_id AND c.user_id = auth.uid()
  )
);
