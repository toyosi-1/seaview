-- Add a dedicated reason column for "Return for Correction" requests on
-- completion reports. The correction_requested BOOLEAN column already
-- exists (see 004_workflow_v2_part2.sql) but there was no column to store
-- the reviewer's note explaining what needs to be corrected.
ALTER TABLE public.completion_reports ADD COLUMN IF NOT EXISTS correction_reason TEXT;
