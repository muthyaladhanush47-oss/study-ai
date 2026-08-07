-- ============================================================
-- StudyAI upgrade: handwriting OCR, study profiles, chat memory
-- Run this AFTER the base schema migration.
-- ============================================================

-- 1) Documents: track how the text was produced ------------------
alter table public.documents
  add column if not exists text_source text not null default 'pdf'
    check (text_source in ('pdf', 'ocr', 'scanned')),
  add column if not exists is_ocr_ready boolean not null default false;

-- 2) Study profiles (adaptive AI tutor) --------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  learning_level text not null default 'beginner'
    check (learning_level in ('beginner', 'intermediate', 'advanced')),
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Chat memory (one conversation per document) ------------------
create table if not exists public.chat_messages (
  id uuid primary key,
  chat_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chat_idx
  on public.chat_messages (chat_id, created_at);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;

-- profiles -----------------------------------------------------
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- chat_messages -------------------------------------------------
drop policy if exists "Users can read own chat messages" on public.chat_messages;
create policy "Users can read own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat messages" on public.chat_messages;
create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.documents d
      where d.id = chat_id and d.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own chat messages" on public.chat_messages;
create policy "Users can delete own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);
