-- Make full_name, contact_person, and phone nullable
-- These fields are no longer required during registration

ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.contractors ALTER COLUMN contact_person DROP NOT NULL;
ALTER TABLE public.contractors ALTER COLUMN phone DROP NOT NULL;
