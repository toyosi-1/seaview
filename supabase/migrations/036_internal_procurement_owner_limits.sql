-- ============================================================
-- Internal procurement requester limits.
--
-- ipr_own (FOR ALL) let the requester UPDATE any field on their
-- own request — including status='approved' — and DELETE it.
-- Requesters legitimately edit fields when responding to a
-- clarification request, but must never set a final status or
-- delete. Staff transitions remain governed by
-- ipr_staff_update / ipr_staff_select.
-- ============================================================

DROP POLICY IF EXISTS "ipr_own" ON public.internal_procurement_requests;

CREATE POLICY "ipr_own_select" ON public.internal_procurement_requests FOR SELECT USING (
  requested_by = auth.uid()
);

CREATE POLICY "ipr_own_insert" ON public.internal_procurement_requests FOR INSERT WITH CHECK (
  requested_by = auth.uid()
);

-- Requesters may edit their request (clarification resubmission)
-- but cannot move it to a final status.
CREATE POLICY "ipr_own_update" ON public.internal_procurement_requests FOR UPDATE USING (
  requested_by = auth.uid()
) WITH CHECK (
  requested_by = auth.uid()
  AND status NOT IN ('approved', 'rejected')
);

-- No DELETE policy: requests cannot be deleted by the requester.
