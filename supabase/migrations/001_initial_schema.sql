-- ============================================================
-- Sea View Properties - Procurement & Contractor Management Portal
-- Initial Schema Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'contractor',
  'md',
  'procurement_officer',
  'head_of_procurement',
  'head_of_audit',
  'head_of_accounts',
  'ict_admin'
);

CREATE TYPE contractor_status AS ENUM ('pending', 'active', 'suspended');

CREATE TYPE proposal_status AS ENUM (
  'submitted',
  'md_review',
  'procurement_review',
  'head_procurement_review',
  'md_final_review',
  'approved',
  'rejected',
  'returned'
);

CREATE TYPE contract_status AS ENUM ('active', 'completed', 'terminated');

CREATE TYPE completion_status AS ENUM (
  'submitted',
  'md_verification',
  'audit_review',
  'accounts_review',
  'payment_pending',
  'payment_completed',
  'rejected'
);

CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'on_hold', 'completed');

CREATE TYPE notification_type AS ENUM (
  'proposal_submitted',
  'proposal_approved',
  'proposal_rejected',
  'proposal_returned',
  'proposal_forwarded',
  'contract_awarded',
  'completion_submitted',
  'audit_approved',
  'audit_rejected',
  'payment_completed',
  'payment_approved'
);

-- ============================================================
-- USERS / PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          user_role NOT NULL DEFAULT 'contractor',
  phone         TEXT,
  department    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  signature_url TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK to auth.users if the auth schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- CONTRACTORS
-- ============================================================

CREATE TABLE public.contractors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL,
  cac_number        TEXT NOT NULL UNIQUE,
  tin_number        TEXT NOT NULL UNIQUE,
  bank_name         TEXT NOT NULL,
  account_number    TEXT NOT NULL,
  account_name      TEXT NOT NULL,
  contact_person    TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  address           TEXT,
  status            contractor_status NOT NULL DEFAULT 'pending',
  verified_at       TIMESTAMPTZ,
  verified_by       UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX idx_contractors_cac ON public.contractors(cac_number);
CREATE INDEX idx_contractors_tin ON public.contractors(tin_number);
CREATE INDEX idx_contractors_company_name ON public.contractors USING gin(company_name gin_trgm_ops);

-- ============================================================
-- CONTRACTOR DOCUMENTS
-- ============================================================

CREATE TABLE public.contractor_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id   UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL, -- 'cac_certificate', 'form_co2', 'tin_certificate', 'other'
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       BIGINT,
  uploaded_by     UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contractor_docs_contractor ON public.contractor_documents(contractor_id);

-- ============================================================
-- PROPOSALS
-- ============================================================

CREATE TABLE public.proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number     TEXT NOT NULL UNIQUE,
  contractor_id       UUID NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  estimated_cost      NUMERIC(18,2) NOT NULL,
  status              proposal_status NOT NULL DEFAULT 'submitted',
  current_stage       TEXT NOT NULL DEFAULT 'md_review',
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  md_reviewed_at      TIMESTAMPTZ,
  md_reviewed_by      UUID REFERENCES public.profiles(id),
  procurement_reviewed_at  TIMESTAMPTZ,
  procurement_reviewed_by  UUID REFERENCES public.profiles(id),
  head_proc_reviewed_at    TIMESTAMPTZ,
  head_proc_reviewed_by    UUID REFERENCES public.profiles(id),
  md_final_approved_at     TIMESTAMPTZ,
  md_final_approved_by     UUID REFERENCES public.profiles(id),
  rejection_reason    TEXT,
  return_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_contractor ON public.proposals(contractor_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_number ON public.proposals(proposal_number);
CREATE INDEX idx_proposals_title ON public.proposals USING gin(title gin_trgm_ops);

-- Auto-generate proposal numbers: PROP-YYYY-XXXX
CREATE SEQUENCE proposal_seq START 1;

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.proposal_number := 'PROP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('proposal_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proposal_number
  BEFORE INSERT ON public.proposals
  FOR EACH ROW
  WHEN (NEW.proposal_number IS NULL OR NEW.proposal_number = '')
  EXECUTE FUNCTION generate_proposal_number();

-- ============================================================
-- PROPOSAL DOCUMENTS
-- ============================================================

CREATE TABLE public.proposal_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'proposal_document', 'supporting'
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     BIGINT,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposal_docs_proposal ON public.proposal_documents(proposal_id);

-- ============================================================
-- PROPOSAL COMMENTS (internal only)
-- ============================================================

CREATE TABLE public.proposal_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES public.profiles(id),
  stage         TEXT NOT NULL, -- 'md_review', 'procurement_review', etc.
  comment       TEXT NOT NULL,
  action        TEXT, -- 'approve', 'reject', 'return', 'forward'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposal_comments_proposal ON public.proposal_comments(proposal_id);

-- ============================================================
-- PROPOSAL TIMELINE (internal only)
-- ============================================================

CREATE TABLE public.proposal_timeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  actor_id      UUID NOT NULL REFERENCES public.profiles(id),
  stage         TEXT NOT NULL,
  action        TEXT NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposal_timeline_proposal ON public.proposal_timeline(proposal_id);

-- ============================================================
-- CONTRACTS
-- ============================================================

CREATE TABLE public.contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number   TEXT NOT NULL UNIQUE,
  proposal_id       UUID NOT NULL REFERENCES public.proposals(id) ON DELETE RESTRICT,
  contractor_id     UUID NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  contract_value    NUMERIC(18,2) NOT NULL,
  status            contract_status NOT NULL DEFAULT 'active',
  award_letter_url  TEXT,
  awarded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  awarded_by        UUID NOT NULL REFERENCES public.profiles(id),
  approval_reference TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_contractor ON public.contracts(contractor_id);
CREATE INDEX idx_contracts_proposal ON public.contracts(proposal_id);
CREATE INDEX idx_contracts_number ON public.contracts(contract_number);

-- Auto-generate contract numbers: CON-YYYY-XXXX
CREATE SEQUENCE contract_seq START 1;

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number := 'CON-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('contract_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
  EXECUTE FUNCTION generate_contract_number();

-- ============================================================
-- COMPLETION REPORTS
-- ============================================================

CREATE TABLE public.completion_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  contractor_id       UUID NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  status              completion_status NOT NULL DEFAULT 'submitted',
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  md_verified_at      TIMESTAMPTZ,
  md_verified_by      UUID REFERENCES public.profiles(id),
  audit_reviewed_at   TIMESTAMPTZ,
  audit_reviewed_by   UUID REFERENCES public.profiles(id),
  audit_comment       TEXT,
  accounts_reviewed_at TIMESTAMPTZ,
  accounts_reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_completion_contract ON public.completion_reports(contract_id);
CREATE INDEX idx_completion_contractor ON public.completion_reports(contractor_id);

-- ============================================================
-- COMPLETION DOCUMENTS
-- ============================================================

CREATE TABLE public.completion_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id   UUID NOT NULL REFERENCES public.completion_reports(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL, -- 'completion_report','image','certificate','supporting'
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       BIGINT,
  uploaded_by     UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_completion_docs_completion ON public.completion_documents(completion_id);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number      TEXT NOT NULL UNIQUE,
  completion_id       UUID NOT NULL REFERENCES public.completion_reports(id) ON DELETE RESTRICT,
  contract_id         UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  contractor_id       UUID NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  amount              NUMERIC(18,2) NOT NULL,
  bank_name           TEXT NOT NULL,
  account_number      TEXT NOT NULL,
  account_name        TEXT NOT NULL,
  tax_deduction       NUMERIC(18,2) DEFAULT 0,
  net_amount          NUMERIC(18,2),
  status              payment_status NOT NULL DEFAULT 'pending',
  approved_by         UUID REFERENCES public.profiles(id),
  approved_at         TIMESTAMPTZ,
  payment_reference   TEXT,
  payment_date        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_completion ON public.payments(completion_id);
CREATE INDEX idx_payments_contractor ON public.payments(contractor_id);
CREATE INDEX idx_payments_number ON public.payments(payment_number);

-- Auto-generate payment numbers: PAY-YYYY-XXXX
CREATE SEQUENCE payment_seq START 1;

CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('payment_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  WHEN (NEW.payment_number IS NULL OR NEW.payment_number = '')
  EXECUTE FUNCTION generate_payment_number();

-- ============================================================
-- PAYMENT DOCUMENTS
-- ============================================================

CREATE TABLE public.payment_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'payment_advice','transfer_evidence','bank_draft','payment_reference'
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     BIGINT,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_docs_payment ON public.payment_documents(payment_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  reference_id  UUID,
  reference_type TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- AUDIT LOGS (immutable)
-- ============================================================

CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id),
  user_role       user_role,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  previous_status TEXT,
  new_status      TEXT,
  details         JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Prevent updates/deletes on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_prevent_audit_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- updated_at TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contractors_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_completion_updated_at BEFORE UPDATE ON public.completion_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completion_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completion_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT USING (get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_ict_all" ON public.profiles FOR ALL USING (get_my_role() = 'ict_admin');

-- CONTRACTORS
CREATE POLICY "contractors_own" ON public.contractors FOR ALL USING (user_id = auth.uid());
CREATE POLICY "contractors_staff_select" ON public.contractors FOR SELECT USING (get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin'));
CREATE POLICY "contractors_staff_update" ON public.contractors FOR UPDATE USING (get_my_role() IN ('md','ict_admin'));

-- CONTRACTOR DOCUMENTS
CREATE POLICY "contractor_docs_own" ON public.contractor_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);
CREATE POLICY "contractor_docs_staff" ON public.contractor_documents FOR SELECT USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);

-- PROPOSALS: contractors see only their own; staff see all
CREATE POLICY "proposals_contractor_own" ON public.proposals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);
CREATE POLICY "proposals_staff_select" ON public.proposals FOR SELECT USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);
CREATE POLICY "proposals_staff_update" ON public.proposals FOR UPDATE USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','ict_admin')
);

-- PROPOSAL DOCUMENTS
CREATE POLICY "proposal_docs_contractor" ON public.proposal_documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.contractors c ON c.id = p.contractor_id
    WHERE p.id = proposal_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "proposal_docs_staff" ON public.proposal_documents FOR SELECT USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);

-- PROPOSAL COMMENTS (internal staff only - contractors cannot see)
CREATE POLICY "proposal_comments_staff_only" ON public.proposal_comments FOR ALL USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);

-- PROPOSAL TIMELINE (internal staff only)
CREATE POLICY "proposal_timeline_staff_only" ON public.proposal_timeline FOR ALL USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);

-- CONTRACTS
CREATE POLICY "contracts_contractor_own" ON public.contracts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);
CREATE POLICY "contracts_staff_select" ON public.contracts FOR SELECT USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);
CREATE POLICY "contracts_staff_insert_update" ON public.contracts FOR ALL USING (
  get_my_role() IN ('md','ict_admin')
);

-- COMPLETION REPORTS
CREATE POLICY "completion_contractor_own" ON public.completion_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
);
CREATE POLICY "completion_staff" ON public.completion_reports FOR ALL USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);

-- COMPLETION DOCUMENTS
CREATE POLICY "completion_docs_contractor" ON public.completion_documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.completion_reports cr
    JOIN public.contractors c ON c.id = cr.contractor_id
    WHERE cr.id = completion_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "completion_docs_staff" ON public.completion_documents FOR SELECT USING (
  get_my_role() IN ('md','procurement_officer','head_of_procurement','head_of_audit','head_of_accounts','ict_admin')
);

-- PAYMENTS
CREATE POLICY "payments_contractor_own" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND c.user_id = auth.uid())
    AND status = 'completed'
);
CREATE POLICY "payments_accounts_staff" ON public.payments FOR ALL USING (
  get_my_role() IN ('head_of_accounts','md','ict_admin')
);
CREATE POLICY "payments_audit_select" ON public.payments FOR SELECT USING (
  get_my_role() IN ('head_of_audit','procurement_officer','head_of_procurement')
);

-- PAYMENT DOCUMENTS: contractor only if payment completed
CREATE POLICY "payment_docs_contractor" ON public.payment_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.contractors c ON c.id = p.contractor_id
    WHERE p.id = payment_id AND c.user_id = auth.uid() AND p.status = 'completed'
  )
);
CREATE POLICY "payment_docs_staff" ON public.payment_documents FOR ALL USING (
  get_my_role() IN ('head_of_accounts','md','ict_admin')
);

-- NOTIFICATIONS: only the recipient
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- AUDIT LOGS: only MD and ICT admin can read; no one can write directly (use service role)
CREATE POLICY "audit_logs_read_md_ict" ON public.audit_logs FOR SELECT USING (
  get_my_role() IN ('md','ict_admin')
);
