CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_contractor_created
  ON public.proposals(contractor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_updated
  ON public.proposals(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_contractor_awarded
  ON public.contracts(contractor_id, awarded_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_project_supervisor
  ON public.contracts(project_supervisor_id)
  WHERE project_supervisor_id IS NOT NULL;

DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND user_role = get_my_role()
);
