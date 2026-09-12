-- RATHOD HUB: 7-day Team vs Team Study War
-- Run this complete file once in Supabase SQL Editor as project owner.
create extension if not exists pgcrypto;

create table if not exists public.study_wars (
  id uuid primary key default gen_random_uuid(),
  team_a_name text not null check(char_length(trim(team_a_name)) between 2 and 30),
  team_b_name text not null check(char_length(trim(team_b_name)) between 2 and 30),
  created_by uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  status text not null default 'active' check(status in ('active','finished')),
  winner_key text check(winner_key in ('a','b')),
  reward_xp integer not null default 150 check(reward_xp between 50 and 1000),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  check(lower(trim(team_a_name)) <> lower(trim(team_b_name)))
);
create unique index if not exists one_active_study_war on public.study_wars(status) where status='active';

create table if not exists public.study_war_members (
  war_id uuid not null references public.study_wars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_key text not null check(team_key in ('a','b')),
  points integer not null default 0 check(points >= 0),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(war_id,user_id)
);
create index if not exists study_war_team_rank on public.study_war_members(war_id,team_key,points desc,updated_at,user_id);

create table if not exists public.study_war_point_events (
  id bigint generated always as identity primary key,
  war_id uuid not null references public.study_wars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check(points between 1 and 100),
  source text not null default 'study',
  created_at timestamptz not null default now()
);
create index if not exists study_war_events_daily on public.study_war_point_events(war_id,user_id,created_at desc);

alter table public.study_wars enable row level security;
alter table public.study_war_members enable row level security;
alter table public.study_war_point_events enable row level security;

drop policy if exists study_wars_read on public.study_wars;
create policy study_wars_read on public.study_wars for select to authenticated using(true);
drop policy if exists study_war_members_read on public.study_war_members;
create policy study_war_members_read on public.study_war_members for select to authenticated using(true);
drop policy if exists study_war_events_read_own on public.study_war_point_events;
create policy study_war_events_read_own on public.study_war_point_events for select to authenticated using(user_id=auth.uid());

grant select on public.study_wars,public.study_war_members,public.study_war_point_events to authenticated;
grant usage,select on sequence public.study_war_point_events_id_seq to authenticated;

create or replace function public.create_study_war(p_team_a_name text,p_team_b_name text,p_reward_xp integer default 150)
returns public.study_wars language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_role text;v_row public.study_wars;
begin
  if v_uid is null then raise exception 'Login required';end if;
  select role into v_role from public.profiles where id=v_uid;
  if coalesce(v_role,'member')<>'admin' then raise exception 'Admin permission required';end if;
  if char_length(trim(p_team_a_name)) not between 2 and 30 or char_length(trim(p_team_b_name)) not between 2 and 30 then raise exception 'Team name must be 2-30 characters';end if;
  if lower(trim(p_team_a_name))=lower(trim(p_team_b_name)) then raise exception 'Team names must be different';end if;
  if exists(select 1 from public.study_wars where status='active') then raise exception 'An active Study War already exists';end if;
  insert into public.study_wars(team_a_name,team_b_name,created_by,starts_at,ends_at,reward_xp)
  values(trim(p_team_a_name),trim(p_team_b_name),v_uid,now(),now()+interval '7 days',greatest(50,least(1000,coalesce(p_reward_xp,150)))) returning * into v_row;
  return v_row;
end $$;

create or replace function public.join_study_war(p_war_id uuid,p_team_key text)
returns public.study_war_members language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_war public.study_wars;v_count integer;v_row public.study_war_members;
begin
  if v_uid is null then raise exception 'Login required';end if;
  if p_team_key not in ('a','b') then raise exception 'Invalid team';end if;
  select * into v_war from public.study_wars where id=p_war_id for update;
  if not found or v_war.status<>'active' or now()>=v_war.ends_at then raise exception 'This Study War is not active';end if;
  if exists(select 1 from public.study_war_members where war_id=p_war_id and user_id=v_uid) then raise exception 'You already joined a team';end if;
  select count(*) into v_count from public.study_war_members where war_id=p_war_id and team_key=p_team_key;
  if v_count>=10 then raise exception 'This team already has 10 members';end if;
  insert into public.study_war_members(war_id,user_id,team_key) values(p_war_id,v_uid,p_team_key) returning * into v_row;
  return v_row;
end $$;

create or replace function public.add_study_war_points(p_points integer,p_source text default 'study')
returns integer language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_war uuid;v_today integer;v_award integer;
begin
  if v_uid is null then raise exception 'Login required';end if;
  select w.id into v_war from public.study_wars w join public.study_war_members m on m.war_id=w.id and m.user_id=v_uid where w.status='active' and now()<w.ends_at order by w.created_at desc limit 1;
  if v_war is null then return 0;end if;
  select coalesce(sum(points),0)::integer into v_today from public.study_war_point_events where war_id=v_war and user_id=v_uid and created_at>=date_trunc('day',now());
  v_award:=least(greatest(coalesce(p_points,0),0),100,greatest(0,1000-v_today));
  if v_award<=0 then return 0;end if;
  insert into public.study_war_point_events(war_id,user_id,points,source) values(v_war,v_uid,v_award,left(coalesce(p_source,'study'),40));
  update public.study_war_members set points=points+v_award,updated_at=now() where war_id=v_war and user_id=v_uid;
  return v_award;
end $$;

create or replace function public.finalize_study_war()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_war public.study_wars;v_a integer;v_b integer;v_winner text;v_rewarded integer:=0;
begin
  select * into v_war from public.study_wars where status='active' and ends_at<=now() order by ends_at limit 1 for update skip locked;
  if not found then return jsonb_build_object('finalized',false);end if;
  select coalesce(sum(points) filter(where team_key='a'),0),coalesce(sum(points) filter(where team_key='b'),0) into v_a,v_b from public.study_war_members where war_id=v_war.id;
  v_winner:=case when v_a>v_b then 'a' when v_b>v_a then 'b' else null end;
  update public.study_wars set status='finished',winner_key=v_winner,finalized_at=now() where id=v_war.id;
  if v_winner is not null then
    with winners as (select user_id from public.study_war_members where war_id=v_war.id and team_key=v_winner)
    update public.profiles p set xp=coalesce(p.xp,0)+v_war.reward_xp from winners w where p.id=w.user_id;
    get diagnostics v_rewarded=row_count;
    if to_regclass('public.hub_notifications') is not null then
      insert into public.hub_notifications(title,body,tag,action,metadata,created_by,expires_at)
      select '🏆 Team Study War Winner!',(case when v_winner='a' then v_war.team_a_name else v_war.team_b_name end)||' won the 7-day battle. +'||v_war.reward_xp||' Wallet XP awarded.','group','rathodnew',jsonb_build_object('target_user_id',m.user_id::text,'war_id',v_war.id::text),v_war.created_by,now()+interval '7 days'
      from public.study_war_members m where m.war_id=v_war.id and m.team_key=v_winner;
    end if;
  end if;
  return jsonb_build_object('finalized',true,'winner',v_winner,'team_a_points',v_a,'team_b_points',v_b,'rewarded_members',v_rewarded);
end $$;

revoke all on function public.create_study_war(text,text,integer) from public;
revoke all on function public.join_study_war(uuid,text) from public;
revoke all on function public.add_study_war_points(integer,text) from public;
revoke all on function public.finalize_study_war() from public;
grant execute on function public.create_study_war(text,text,integer),public.join_study_war(uuid,text),public.add_study_war_points(integer,text),public.finalize_study_war() to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='study_wars') then alter publication supabase_realtime add table public.study_wars;end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='study_war_members') then alter publication supabase_realtime add table public.study_war_members;end if;
end $$;

