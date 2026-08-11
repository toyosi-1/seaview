-- ============================================================
-- 011: Tenders table + proposal link + RLS policies
-- ============================================================

-- 1. Tender status enum
CREATE TYPE tender_status AS ENUM ('open', 'closed', 'awarded', 'cancelled');

-- 2. Tenders table
CREATE TABLE IF NOT EXISTS public.tenders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  estimated_value NUMERIC(18,2) NOT NULL,
  requirements    TEXT,
  closing_date    TIMESTAMPTZ,
  status          tender_status NOT NULL DEFAULT 'open',
  posted_by       UUID NOT NULL REFERENCES public.profiles(id),
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_number ON public.tenders(contract_number);

-- 3. Auto-generate contract numbers: SPL/HQ/MD/PROC/#####
CREATE SEQUENCE IF NOT EXISTS tender_contract_seq START 1;

CREATE OR REPLACE FUNCTION generate_tender_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val INTEGER;
BEGIN
  SELECT nextval('tender_contract_seq') INTO seq_val;
  NEW.contract_number := 'SPL/HQ/MD/PROC/' || lpad(seq_val::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tender_contract_number ON public.tenders;
CREATE TRIGGER trg_tender_contract_number
  BEFORE INSERT ON public.tenders
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
  EXECUTE FUNCTION generate_tender_contract_number();

-- 4. Add tender_id to proposals
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_tender ON public.proposals(tender_id);

-- 5. Updated_at trigger for tenders
DROP TRIGGER IF EXISTS trg_tenders_updated_at ON public.tenders;
CREATE TRIGGER trg_tenders_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. RLS for tenders
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Contractors can see open/awarded/closed tenders
CREATE POLICY "tenders_contractor_select" ON public.tenders FOR SELECT USING (
  status IN ('open', 'awarded', 'closed')
);
-- Staff can see all tenders
CREATE POLICY "tenders_staff_select" ON public.tenders FOR SELECT USING (
  get_my_role() IN ('md', 'head_of_procurement', 'contract_officer', 'head_of_environment', 'head_of_ict', 'head_of_audit', 'head_of_accounts', 'ict_admin')
);
-- Contract Officer and MD can insert/update tenders
CREATE POLICY "tenders_officer_insert" ON public.tenders FOR INSERT WITH CHECK (
  get_my_role() IN ('contract_officer', 'md', 'ict_admin')
);
CREATE POLICY "tenders_officer_update" ON public.tenders FOR UPDATE USING (
  get_my_role() IN ('contract_officer', 'md', 'ict_admin')
);

-- 7. Allow contract_officer to read proposals (they manage tenders)
CREATE POLICY "proposals_officer_select" ON public.proposals FOR SELECT USING (
  get_my_role() = 'contract_officer'
);
