-- RATHOD HUB Question Archive
-- Run once in Supabase SQL Editor.
create table if not exists public.rh_question_archive (
  id bigint generated always as identity primary key,
  source_event_id bigint references public.rh_bridge_events(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  source text not null default 'app',
  mode text not null default 'quiz',
  quiz_name text not null default 'Practice Quiz',
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index integer,
  explanation text not null default '',
  created_at timestamptz not null default now(),
  drive_notes_file_id text,
  drive_notes_url text,
  drive_test_file_id text,
  drive_test_url text,
  archived_at timestamptz,
  unique(source, mode, question, created_at)
);
create index if not exists rh_question_archive_created_idx on public.rh_question_archive(created_at desc);
create index if not exists rh_question_archive_mode_idx on public.rh_question_archive(mode, created_at desc);
alter table public.rh_question_archive enable row level security;
drop policy if exists rh_question_archive_insert_own on public.rh_question_archive;
create policy rh_question_archive_insert_own on public.rh_question_archive for insert to authenticated with check (user_id = auth.uid());
drop policy if exists rh_question_archive_select_own on public.rh_question_archive;
create policy rh_question_archive_select_own on public.rh_question_archive for select to authenticated using (user_id = auth.uid() or user_id is null);
grant insert, select on public.rh_question_archive to authenticated;
