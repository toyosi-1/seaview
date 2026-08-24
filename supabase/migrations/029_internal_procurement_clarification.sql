-- Add "Return for Clarification" support to internal procurement requests,
-- mirroring the completion_reports correction_requested workflow. This lets
-- a reviewer (MD or Head of Procurement) send a request back to the
-- requester to fix/clarify details without a hard reject, keeping the same
-- request thread and audit trail.
ALTER TABLE public.internal_procurement_requests ADD COLUMN IF NOT EXISTS clarification_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.internal_procurement_requests ADD COLUMN IF NOT EXISTS clarification_reason TEXT;
