-- ============================================================
-- Study Assistant schema (run in the Supabase SQL editor)
-- ============================================================

-- Documents table ---------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  file_name text not null,
  file_path text not null,
  file_size bigint not null default 0,
  page_count integer,
  created_at timestamptz not null default now()
);

-- Extracted text for a document --------------------------------
create table if not exists public.document_content (
  document_id uuid primary key references public.documents (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Study activities (summaries, flashcards, quizzes, chats) ------
create table if not exists public.study_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.documents (id) on delete cascade,
  type text not null check (type in ('summary', 'flashcards', 'quiz', 'chat')),
  title text not null default 'Activity',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists study_activities_user_id_idx on public.study_activities (user_id);
create index if not exists study_activities_document_id_idx on public.study_activities (document_id);

-- Storage bucket for PDFs (private) -----------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.documents enable row level security;
alter table public.document_content enable row level security;
alter table public.study_activities enable row level security;

-- documents ----------------------------------------------------
drop policy if exists "Users can read own documents" on public.documents;
create policy "Users can read own documents"
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- document_content ----------------------------------------------
drop policy if exists "Users can read content of own documents" on public.document_content;
create policy "Users can read content of own documents"
  on public.document_content for select
  using (exists (
    select 1 from public.documents d
    where d.id = document_id and d.user_id = auth.uid()
  ));

drop policy if exists "Users can insert content of own documents" on public.document_content;
create policy "Users can insert content of own documents"
  on public.document_content for insert
  with check (exists (
    select 1 from public.documents d
    where d.id = document_id and d.user_id = auth.uid()
  ));

drop policy if exists "Users can update content of own documents" on public.document_content;
create policy "Users can update content of own documents"
  on public.document_content for update
  using (exists (
    select 1 from public.documents d
    where d.id = document_id and d.user_id = auth.uid()
  ));

drop policy if exists "Users can delete content of own documents" on public.document_content;
create policy "Users can delete content of own documents"
  on public.document_content for delete
  using (exists (
    select 1 from public.documents d
    where d.id = document_id and d.user_id = auth.uid()
  ));

-- study_activities ------------------------------------------------
drop policy if exists "Users can read own activities" on public.study_activities;
create policy "Users can read own activities"
  on public.study_activities for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own activities" on public.study_activities;
create policy "Users can insert own activities"
  on public.study_activities for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own activities" on public.study_activities;
create policy "Users can update own activities"
  on public.study_activities for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own activities" on public.study_activities;
create policy "Users can delete own activities"
  on public.study_activities for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Storage RLS (private bucket "documents")
-- Files are stored under <user_id>/<uuid>.pdf
-- ============================================================
drop policy if exists "Users can read own files" on storage.objects;
create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own files" on storage.objects;
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own files" on storage.objects;
create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own files" on storage.objects;
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
