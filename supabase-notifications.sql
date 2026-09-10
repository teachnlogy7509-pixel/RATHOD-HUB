-- RATHOD HUB persistent notifications (run once in Supabase SQL Editor)
create extension if not exists pgcrypto;

create table if not exists public.hub_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  tag text not null default 'rathod-hub',
  action text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists hub_notifications_created_at_idx on public.hub_notifications (created_at desc);
create index if not exists hub_notifications_expires_at_idx on public.hub_notifications (expires_at);
alter table public.hub_notifications enable row level security;

drop policy if exists hub_notifications_read_authenticated on public.hub_notifications;
create policy hub_notifications_read_authenticated
on public.hub_notifications for select to authenticated
using (expires_at > now());

create or replace function public.publish_hub_notification(
  p_title text,
  p_body text default '',
  p_tag text default 'rathod-hub',
  p_action text default '',
  p_metadata jsonb default '{}'::jsonb
) returns public.hub_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_row public.hub_notifications;
  v_admin_tags text[] := array['admin','material','event','test','dailyquiz','announcement'];
  v_member_tags text[] := array['livequiz','voice','group','bounty','treasure','rathod-hub'];
begin
  if v_uid is null then raise exception 'Login required'; end if;
  select p.role into v_role from public.profiles p where p.id = v_uid;
  if not (p_tag = any(v_admin_tags) or p_tag = any(v_member_tags)) then
    raise exception 'Unsupported notification type';
  end if;
  if p_tag = any(v_admin_tags) and coalesce(v_role,'member') <> 'admin' then
    raise exception 'Admin permission required';
  end if;
  if p_tag = 'voice' and exists (
    select 1 from public.hub_notifications n
    where n.created_by=v_uid and n.tag='voice'
      and coalesce(n.metadata->>'room','')=coalesce(p_metadata->>'room','')
      and n.created_at > now()-interval '60 seconds'
  ) then
    select * into v_row from public.hub_notifications n
    where n.created_by=v_uid and n.tag='voice'
      and coalesce(n.metadata->>'room','')=coalesce(p_metadata->>'room','')
    order by n.created_at desc limit 1;
    return v_row;
  end if;
  if (select count(*) from public.hub_notifications n where n.created_by=v_uid and n.created_at>now()-interval '10 minutes') >= 8 then
    raise exception 'Notification rate limit reached. Please wait.';
  end if;
  insert into public.hub_notifications(title,body,tag,action,metadata,created_by)
  values(left(coalesce(nullif(trim(p_title),''),'RATHOD HUB'),100),left(coalesce(p_body,''),300),p_tag,left(coalesce(p_action,''),40),coalesce(p_metadata,'{}'::jsonb),v_uid)
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.publish_hub_notification(text,text,text,text,jsonb) from public;
grant execute on function public.publish_hub_notification(text,text,text,text,jsonb) to authenticated;

-- Enable INSERT events for Supabase Realtime once, without duplicate-publication errors.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='hub_notifications'
  ) then
    alter publication supabase_realtime add table public.hub_notifications;
  end if;
end $$;
