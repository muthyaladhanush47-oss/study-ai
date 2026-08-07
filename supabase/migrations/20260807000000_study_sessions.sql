-- ============================================================
-- StudyAI upgrade: study time tracking
-- Run this AFTER the base schema + 20260201000000_upgrade migrations.
-- ============================================================

-- 1) Study sessions: daily active-time aggregate per user -------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists study_sessions_user_id_idx
  on public.study_sessions (user_id, date);

alter table public.study_sessions enable row level security;

-- study_sessions ----------------------------------------------------
drop policy if exists "Users can read own study sessions" on public.study_sessions;
create policy "Users can read own study sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own study sessions" on public.study_sessions;
create policy "Users can insert own study sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own study sessions" on public.study_sessions;
create policy "Users can update own study sessions"
  on public.study_sessions for update
  using (auth.uid() = user_id);
