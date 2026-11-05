-- ============================================================
-- Enforce contractor suspension at the database level.
--
-- The UI already blocks suspended contractors, but the RLS
-- policies only checked ownership — a suspended contractor
-- could still insert proposals or completion reports (and
-- update a returned quotation) via direct API calls. Now the
-- policies also require contractors.status = 'active'.
-- ============================================================

DROP POLICY IF EXISTS "proposals_contractor_insert" ON public.proposals;
CREATE POLICY "proposals_contractor_insert" ON public.proposals FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractors c
    WHERE c.id = contractor_id AND c.user_id = auth.uid() AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS "proposals_contractor_update" ON public.proposals;
CREATE POLICY "proposals_contractor_update" ON public.proposals FOR UPDATE USING (
  status = 'returned' AND EXISTS (
    SELECT 1 FROM public.contractors c
    WHERE c.id = contractor_id AND c.user_id = auth.uid() AND c.status = 'active'
  )
) WITH CHECK (
  status::text = current_stage AND EXISTS (
    SELECT 1 FROM public.contractors c
    WHERE c.id = contractor_id AND c.user_id = auth.uid() AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS "completion_contractor_own" ON public.completion_reports;

CREATE POLICY "completion_contractor_select" ON public.completion_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);

CREATE POLICY "completion_contractor_insert" ON public.completion_reports FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractors c
    WHERE c.id = contractor_id AND c.user_id = auth.uid() AND c.status = 'active'
  )
);

CREATE POLICY "completion_contractor_update" ON public.completion_reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.contractors c
    WHERE c.id = contractor_id AND c.user_id = auth.uid() AND c.status = 'active'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractors c
    WHERE c.id = contractor_id AND c.user_id = auth.uid() AND c.status = 'active'
  )
);
