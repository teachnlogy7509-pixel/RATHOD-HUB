-- RATHOD NEW: public study batches with realtime discussion
-- Run once in Supabase SQL Editor.
create table if not exists public.study_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 3 and 80),
  subject text not null check(subject in ('Biology','Chemistry','Physics','Mixed NEET')),
  description text not null default '',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  owner_name text not null,
  created_at timestamptz not null default now(),
  active boolean not null default true
);
create table if not exists public.study_batch_members (
  batch_id uuid not null references public.study_batches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(batch_id,user_id)
);
create table if not exists public.study_batch_messages (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.study_batches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  message text not null check(char_length(message) between 1 and 1000),
  reply_to bigint references public.study_batch_messages(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists study_batches_created_idx on public.study_batches(created_at desc);
create index if not exists study_batch_messages_room_idx on public.study_batch_messages(batch_id,created_at desc);

alter table public.study_batches enable row level security;
alter table public.study_batch_members enable row level security;
alter table public.study_batch_messages enable row level security;
drop policy if exists "public batches read" on public.study_batches;
create policy "public batches read" on public.study_batches for select to authenticated using(active);
drop policy if exists "users create batches" on public.study_batches;
create policy "users create batches" on public.study_batches for insert to authenticated with check(auth.uid()=owner_id);
drop policy if exists "owners update batches" on public.study_batches;
create policy "owners update batches" on public.study_batches for update to authenticated using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
drop policy if exists "batch members read" on public.study_batch_members;
create policy "batch members read" on public.study_batch_members for select to authenticated using(true);
drop policy if exists "users join batches" on public.study_batch_members;
create policy "users join batches" on public.study_batch_members for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "users leave batches" on public.study_batch_members;
create policy "users leave batches" on public.study_batch_members for delete to authenticated using(auth.uid()=user_id);
drop policy if exists "batch messages read" on public.study_batch_messages;
create policy "batch messages read" on public.study_batch_messages for select to authenticated using(true);
drop policy if exists "members send batch messages" on public.study_batch_messages;
create policy "members send batch messages" on public.study_batch_messages for insert to authenticated with check(auth.uid()=user_id and exists(select 1 from public.study_batch_members m where m.batch_id=study_batch_messages.batch_id and m.user_id=auth.uid()));

grant select,insert,update on public.study_batches to authenticated;
grant select,insert,delete on public.study_batch_members to authenticated;
grant select,insert on public.study_batch_messages to authenticated;
grant usage,select on sequence public.study_batch_messages_id_seq to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.study_batches;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.study_batch_members;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.study_batch_messages;
exception when duplicate_object then null; end $$;
