-- ============================================================
-- StudyAI upgrade: raise the documents bucket size limit to 100 MB.
-- Supabase Storage defaults to a 50 MB per-file limit; large
-- handwritten PDFs can exceed that. Files are uploaded directly
-- from the browser to this bucket (not through the Vercel function).
--
-- This is idempotent and safe to re-run. Run it in the hosted
-- Supabase SQL editor for project:
--   https://ayahuxcznenazqweeulp.supabase.co
-- ============================================================

-- The column exists on all current Supabase projects; the no-op guard
-- keeps this safe on older ones too.
alter table storage.buckets
  add column if not exists file_size_limit bigint;

-- 104857600 = 100 MB in bytes.
update storage.buckets
  set file_size_limit = 104857600
  where id = 'documents'
    and file_size_limit is distinct from 104857600;
