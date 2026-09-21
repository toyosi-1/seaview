ALTER TABLE public.completion_reports
  ADD COLUMN IF NOT EXISTS correction_response TEXT,
  ADD COLUMN IF NOT EXISTS correction_responded_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_completion_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.completion_reports
    WHERE contract_id = NEW.contract_id
  ) THEN
    RAISE EXCEPTION 'A completion report already exists for this contract. Open the existing report to continue the workflow.'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_completion_report ON public.completion_reports;
CREATE TRIGGER trg_prevent_duplicate_completion_report
  BEFORE INSERT ON public.completion_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_completion_report();
