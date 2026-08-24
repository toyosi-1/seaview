-- New notification type for the "Return for Correction" completion workflow.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'completion_correction_requested';
