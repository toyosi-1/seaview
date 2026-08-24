-- New notification type for the "Return for Clarification" internal procurement workflow.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'procurement_clarification_requested';
