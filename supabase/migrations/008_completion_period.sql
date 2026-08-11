-- ============================================================
-- Add completion_period to contracts (used on award letters)
-- ============================================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS completion_period TEXT;
