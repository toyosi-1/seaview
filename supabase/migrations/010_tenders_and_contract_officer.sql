-- ============================================================
-- 010: Add 'contract_officer' to user_role enum
-- Must run in its own transaction (PostgreSQL requirement)
-- ============================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contract_officer';
