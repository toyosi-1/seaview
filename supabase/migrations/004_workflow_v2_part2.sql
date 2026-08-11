-- ============================================================
-- Sea View Properties - Workflow V2 Migration (Part 2)
-- Runs after enum values from 003 have committed.
-- ============================================================

-- ------------------------------------------------------------
-- DEPARTMENT ENUM
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_type') THEN
    CREATE TYPE department_type AS ENUM ('procurement', 'environment', 'ict', 'audit', 'accounts');
  END IF;
END $$;

-- ------------------------------------------------------------
-- PROPOSALS: appraisal fields
-- ------------------------------------------------------------
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS appraisal_notes TEXT;

-- ------------------------------------------------------------
-- CONTRACTS: department assignment / project supervisor
-- ------------------------------------------------------------
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS responsible_department department_type;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS project_supervisor_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS department_assigned_at TIMESTAMPTZ;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS department_assigned_by UUID REFERENCES public.profiles(id);

-- ------------------------------------------------------------
-- COMPLETION REPORTS: project supervisor review fields
-- ------------------------------------------------------------
ALTER TABLE public.completion_reports ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.completion_reports ADD COLUMN IF NOT EXISTS supervisor_reviewed_at TIMESTAMPTZ;
ALTER TABLE public.completion_reports ADD COLUMN IF NOT EXISTS supervisor_reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.completion_reports ADD COLUMN IF NOT EXISTS supervisor_notes TEXT;
ALTER TABLE public.completion_reports ADD COLUMN IF NOT EXISTS correction_requested BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- INTERNAL PROCUREMENT MODULE
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'internal_procurement_status') THEN
    CREATE TYPE internal_procurement_status AS ENUM ('submitted', 'md_review', 'procurement_review', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.internal_procurement_requests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number            TEXT NOT NULL UNIQUE,
  department                department_type NOT NULL,
  requested_by              UUID NOT NULL REFERENCES public.profiles(id),
  item_description          TEXT NOT NULL,
  quantity                  INTEGER NOT NULL DEFAULT 1,
  estimated_cost            NUMERIC(18,2) NOT NULL,
  reason                    TEXT NOT NULL,
  status                    internal_procurement_status NOT NULL DEFAULT 'submitted',
  md_reviewed_at            TIMESTAMPTZ,
  md_reviewed_by            UUID REFERENCES public.profiles(id),
  procurement_reviewed_at   TIMESTAMPTZ,
  procurement_reviewed_by   UUID REFERENCES public.profiles(id),
  rejection_reason          TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ipr_requested_by ON public.internal_procurement_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_ipr_status ON public.internal_procurement_requests(status);

CREATE SEQUENCE IF NOT EXISTS internal_procurement_seq START 1;

CREATE OR REPLACE FUNCTION generate_internal_procurement_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'IPR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('internal_procurement_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_internal_procurement_number ON public.internal_procurement_requests;
CREATE TRIGGER trg_internal_procurement_number
  BEFORE INSERT ON public.internal_procurement_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_internal_procurement_number();

DROP TRIGGER IF EXISTS trg_ipr_updated_at ON public.internal_procurement_requests;
CREATE TRIGGER trg_ipr_updated_at BEFORE UPDATE ON public.internal_procurement_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.internal_procurement_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES public.internal_procurement_requests(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     BIGINT,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ipr_docs_request ON public.internal_procurement_documents(request_id);

ALTER TABLE public.internal_procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_procurement_documents ENABLE ROW LEVEL SECURITY;

-- Requesters see their own; MD, Head of Procurement, ICT admin see all
DROP POLICY IF EXISTS "ipr_own" ON public.internal_procurement_requests;
CREATE POLICY "ipr_own" ON public.internal_procurement_requests FOR ALL USING (requested_by = auth.uid());

DROP POLICY IF EXISTS "ipr_staff_select" ON public.internal_procurement_requests;
CREATE POLICY "ipr_staff_select" ON public.internal_procurement_requests FOR SELECT USING (
  get_my_role() IN ('md', 'head_of_procurement', 'ict_admin')
);

DROP POLICY IF EXISTS "ipr_staff_update" ON public.internal_procurement_requests;
CREATE POLICY "ipr_staff_update" ON public.internal_procurement_requests FOR UPDATE USING (
  get_my_role() IN ('md', 'head_of_procurement', 'ict_admin')
);

DROP POLICY IF EXISTS "ipr_docs_own" ON public.internal_procurement_documents;
CREATE POLICY "ipr_docs_own" ON public.internal_procurement_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.internal_procurement_requests r WHERE r.id = request_id AND r.requested_by = auth.uid())
);

DROP POLICY IF EXISTS "ipr_docs_staff" ON public.internal_procurement_documents;
CREATE POLICY "ipr_docs_staff" ON public.internal_procurement_documents FOR SELECT USING (
  get_my_role() IN ('md', 'head_of_procurement', 'ict_admin')
);

-- ============================================================
-- UPDATED RLS: broaden internal-staff checks to include new roles
-- ============================================================

CREATE OR REPLACE FUNCTION is_internal_staff()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN (
    'md','head_of_procurement','head_of_environment','head_of_ict',
    'head_of_audit','head_of_accounts','ict_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT USING (is_internal_staff());

DROP POLICY IF EXISTS "contractors_staff_select" ON public.contractors;
CREATE POLICY "contractors_staff_select" ON public.contractors FOR SELECT USING (is_internal_staff());

DROP POLICY IF EXISTS "contractor_docs_staff" ON public.contractor_documents;
CREATE POLICY "contractor_docs_staff" ON public.contractor_documents FOR SELECT USING (is_internal_staff());

DROP POLICY IF EXISTS "proposals_staff_select" ON public.proposals;
CREATE POLICY "proposals_staff_select" ON public.proposals FOR SELECT USING (is_internal_staff());

DROP POLICY IF EXISTS "proposals_staff_update" ON public.proposals;
CREATE POLICY "proposals_staff_update" ON public.proposals FOR UPDATE USING (
  get_my_role() IN ('md', 'head_of_procurement', 'ict_admin')
);

DROP POLICY IF EXISTS "proposal_docs_staff" ON public.proposal_documents;
CREATE POLICY "proposal_docs_staff" ON public.proposal_documents FOR SELECT USING (is_internal_staff());

DROP POLICY IF EXISTS "proposal_comments_staff_only" ON public.proposal_comments;
CREATE POLICY "proposal_comments_staff_only" ON public.proposal_comments FOR ALL USING (is_internal_staff());

DROP POLICY IF EXISTS "proposal_timeline_staff_only" ON public.proposal_timeline;
CREATE POLICY "proposal_timeline_staff_only" ON public.proposal_timeline FOR ALL USING (is_internal_staff());

DROP POLICY IF EXISTS "contracts_staff_select" ON public.contracts;
CREATE POLICY "contracts_staff_select" ON public.contracts FOR SELECT USING (is_internal_staff());

DROP POLICY IF EXISTS "completion_staff" ON public.completion_reports;
CREATE POLICY "completion_staff" ON public.completion_reports FOR ALL USING (is_internal_staff());

DROP POLICY IF EXISTS "completion_docs_staff" ON public.completion_documents;
CREATE POLICY "completion_docs_staff" ON public.completion_documents FOR SELECT USING (is_internal_staff());
