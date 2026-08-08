-- ============================================================
-- StudyAI upgrade: document processing lifecycle + error tracking
-- Run this AFTER the base schema + 20260201000000_upgrade migrations.
-- ============================================================

-- 1) Documents: track processing state so the UI can show
--    "pending / processing / ready / failed" and useful errors.
alter table public.documents
  add column if not exists processing_status text not null default 'ready'
    check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  add column if not exists processing_error text;

-- Backfill existing rows:
--  - scanned documents that are not OCR-ready yet are waiting on OCR.
--  - everything else is already ready.
update public.documents
  set processing_status = case
    when is_ocr_ready = true then 'ready'
    when text_source = 'scanned' then 'pending'
    else 'ready'
  end
  where processing_status = 'ready' and processing_status is distinct from (
    case
      when is_ocr_ready = true then 'ready'
      when text_source = 'scanned' then 'pending'
      else 'ready'
    end
  );
