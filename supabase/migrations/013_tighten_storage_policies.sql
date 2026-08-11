-- ============================================================
-- Tighten storage RLS policies for 'documents' bucket
-- Fix: DELETE and UPDATE were too permissive (any authenticated
-- user could delete/update any file)
-- ============================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Owner update" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete" ON storage.objects;

-- UPDATE: only internal staff can update files in the documents bucket
CREATE POLICY "documents_staff_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND is_internal_staff()
);

-- DELETE: only internal staff can delete files in the documents bucket
CREATE POLICY "documents_staff_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND is_internal_staff()
);
