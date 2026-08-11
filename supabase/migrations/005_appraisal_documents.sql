-- ============================================================
-- Procurement Appraisal Supporting Documents
-- Private storage bucket + RLS so only internal staff can
-- upload/view appraisal attachments. Contractors never get access.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'appraisal-documents',
  'appraisal-documents',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "appraisal_docs_staff_insert" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'appraisal-documents' AND is_internal_staff());

CREATE POLICY "appraisal_docs_staff_select" ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'appraisal-documents' AND is_internal_staff());

CREATE POLICY "appraisal_docs_staff_delete" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'appraisal-documents' AND is_internal_staff());

-- ============================================================
-- Restrict proposal_documents metadata: contractors must never
-- see rows for appraisal_document type, even the filename.
-- ============================================================

DROP POLICY IF EXISTS "proposal_docs_contractor" ON public.proposal_documents;
CREATE POLICY "proposal_docs_contractor" ON public.proposal_documents FOR ALL USING (
  document_type != 'appraisal_document' AND EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.contractors c ON c.id = p.contractor_id
    WHERE p.id = proposal_id AND c.user_id = auth.uid()
  )
);

-- Internal staff can insert appraisal documents (staff already have
-- SELECT via proposal_docs_staff; add explicit insert policy).
DROP POLICY IF EXISTS "proposal_docs_staff_insert" ON public.proposal_documents;
CREATE POLICY "proposal_docs_staff_insert" ON public.proposal_documents FOR INSERT
WITH CHECK (is_internal_staff());
