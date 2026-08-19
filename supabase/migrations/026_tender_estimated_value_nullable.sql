-- Make estimated_value nullable on tenders since contracts are posted
-- without an amount; contractors now provide their own quotes.
ALTER TABLE public.tenders ALTER COLUMN estimated_value DROP NOT NULL;
