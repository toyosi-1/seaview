-- ============================================================
-- Allow Head of Procurement to update contracts (e.g. completion_period)
-- Previously only 'md' and 'ict_admin' could update contracts, which
-- silently blocked the Head of Procurement's completion-period editor
-- via RLS even though the UI exposed it to that role.
-- ============================================================

DROP POLICY IF EXISTS "contracts_staff_insert_update" ON public.contracts;

CREATE POLICY "contracts_staff_insert_update" ON public.contracts FOR ALL USING (
  get_my_role() IN ('md', 'ict_admin', 'head_of_procurement')
);
