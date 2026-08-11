-- ============================================================
-- Sea View Properties - Workflow V2 Migration
-- Corrected contractor workflow, ICT department assignment,
-- project supervisor model, internal procurement module
-- ============================================================

-- ------------------------------------------------------------
-- NEW ROLES
-- ------------------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'head_of_environment';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'head_of_ict';

-- ------------------------------------------------------------
-- NEW PROPOSAL STAGES
-- ------------------------------------------------------------
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'procurement_appraisal';
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'ict_assignment';

-- ------------------------------------------------------------
-- NEW COMPLETION STAGE (Project Supervisor review)
-- ------------------------------------------------------------
ALTER TYPE completion_status ADD VALUE IF NOT EXISTS 'supervisor_review';

