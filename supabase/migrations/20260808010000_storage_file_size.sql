-- ============================================================
-- StudyAI upgrade: raise the documents bucket size limit to 100 MB.
-- Supabase Storage defaults to a 50 MB per-file limit; large
-- handwritten PDFs can exceed that. Files are uploaded directly
-- from the browser to this bucket (not through the Vercel function).
-- ============================================================

update storage.buckets
set file_size_limit = 104857600 -- 100 MB in bytes
where id = 'documents';
