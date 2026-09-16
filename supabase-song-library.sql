-- RATHOD HUB Song Library (Google Drive mode)
-- Run this updated file once in Supabase SQL Editor.
-- Supabase stores only song metadata; MP4/MP3 bytes are not stored here.
create extension if not exists pgcrypto;

create table if not exists public.rh_song_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_bucket text,
  source_path text,
  source_type text not null default 'audio/mpeg',
  audio_url text,
  drive_url text,
  drive_file_id text,
  status text not null default 'queued' check (status in ('queued','processing','ready','error')),
  error_message text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe migration for the earlier Storage-queue version.
alter table public.rh_song_library alter column source_bucket drop not null;
alter table public.rh_song_library alter column source_path drop not null;
create index if not exists rh_song_library_ready_idx on public.rh_song_library(status, created_at desc);

alter table public.rh_song_library enable row level security;
drop policy if exists rh_song_public_ready_read on public.rh_song_library;
create policy rh_song_public_ready_read on public.rh_song_library
  for select to anon, authenticated
  using (status = 'ready');

drop policy if exists rh_song_owner_read_all on public.rh_song_library;
create policy rh_song_owner_read_all on public.rh_song_library
  for select to authenticated
  using (lower(coalesce(auth.jwt()->>'email','')) = 'teachnlogy7509@gmail.com');

drop policy if exists rh_song_owner_insert on public.rh_song_library;
create policy rh_song_owner_insert on public.rh_song_library
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and lower(coalesce(auth.jwt()->>'email','')) = 'teachnlogy7509@gmail.com'
  );

drop policy if exists rh_song_owner_update on public.rh_song_library;
create policy rh_song_owner_update on public.rh_song_library
  for update to authenticated
  using (lower(coalesce(auth.jwt()->>'email','')) = 'teachnlogy7509@gmail.com')
  with check (lower(coalesce(auth.jwt()->>'email','')) = 'teachnlogy7509@gmail.com');

-- Existing private buckets can remain private. The new upload API does not
-- write any media bytes to Supabase Storage, so Storage usage will not grow.
