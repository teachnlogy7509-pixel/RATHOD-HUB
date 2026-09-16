-- RATHOD HUB Song Library
-- Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.rh_song_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_bucket text not null default 'rh-song-uploads',
  source_path text not null,
  source_type text not null default 'video/mp4',
  audio_url text,
  drive_url text,
  drive_file_id text,
  status text not null default 'queued' check (status in ('queued','processing','ready','error')),
  error_message text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rh_song_library_ready_idx on public.rh_song_library(status, created_at desc);
create index if not exists rh_song_library_queue_idx on public.rh_song_library(status, created_at asc);

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

-- Private upload bucket: only the owner may upload MP4/audio files.
insert into storage.buckets (id, name, public)
values ('rh-song-uploads', 'rh-song-uploads', false)
on conflict (id) do update set public = false;

drop policy if exists rh_song_upload_owner on storage.objects;
create policy rh_song_upload_owner on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'rh-song-uploads'
    and lower(coalesce(auth.jwt()->>'email','')) = 'teachnlogy7509@gmail.com'
  );

drop policy if exists rh_song_upload_owner_read on storage.objects;
create policy rh_song_upload_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rh-song-uploads'
    and lower(coalesce(auth.jwt()->>'email','')) = 'teachnlogy7509@gmail.com'
  );

-- Public playback bucket: the processed MP3 is also mirrored here so the
-- browser can stream it reliably; Google Drive remains the connected archive.
insert into storage.buckets (id, name, public)
values ('rh-song-audio', 'rh-song-audio', true)
on conflict (id) do update set public = true;

drop policy if exists rh_song_audio_public_read on storage.objects;
create policy rh_song_audio_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'rh-song-audio');
