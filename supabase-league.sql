-- RATHOD HUB 13-day League Leaderboard
-- Run once in Supabase SQL Editor as the project owner.

create extension if not exists pgcrypto;

create table if not exists public.league_state (
  id smallint primary key default 1 check (id = 1),
  season_number integer not null default 1,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '13 days'),
  updated_at timestamptz not null default now()
);

insert into public.league_state(id,season_number,starts_at,ends_at)
values(1,1,now(),now()+interval '13 days')
on conflict (id) do nothing;

create table if not exists public.league_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  league_level smallint not null default 1 check (league_level between 1 and 10),
  group_no integer not null default 1 check (group_no >= 1),
  season_xp integer not null default 0 check (season_xp >= 0),
  season_number integer not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists league_members_board_idx
on public.league_members(season_number,league_level,group_no,season_xp desc,updated_at,user_id);

create table if not exists public.league_season_results (
  id uuid primary key default gen_random_uuid(),
  season_number integer not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_level smallint not null,
  old_group integer not null,
  final_rank integer not null,
  final_xp integer not null,
  result text not null check (result in ('promoted','safe','demoted','level_cap','level_floor')),
  new_level smallint not null,
  created_at timestamptz not null default now(),
  unique(season_number,user_id)
);

alter table public.league_state enable row level security;
alter table public.league_members enable row level security;
alter table public.league_season_results enable row level security;

drop policy if exists league_state_read on public.league_state;
create policy league_state_read on public.league_state for select to authenticated using (true);
drop policy if exists league_members_read on public.league_members;
create policy league_members_read on public.league_members for select to authenticated using (true);
drop policy if exists league_results_read_own on public.league_season_results;
create policy league_results_read_own on public.league_season_results for select to authenticated using (user_id=auth.uid());

-- First-season reset: top 15 by existing lifetime XP enter Level 2; everyone else enters Level 1.
-- It runs only when league_members is empty, so re-running this migration will not reset a live season.
with overall as (
  select p.id,p.xp,row_number() over(order by coalesce(p.xp,0) desc,p.id) as overall_rank
  from public.profiles p
), assigned as (
  select id,case when overall_rank<=15 then 2 else 1 end::smallint as league_level,coalesce(xp,0) as old_xp
  from overall
), grouped as (
  select id,league_level,((row_number() over(partition by league_level order by old_xp desc,id)-1)/15+1)::integer as group_no
  from assigned
)
insert into public.league_members(user_id,league_level,group_no,season_xp,season_number)
select g.id,g.league_level,g.group_no,0,1 from grouped g
where not exists(select 1 from public.league_members)
on conflict(user_id) do nothing;

create or replace function public.assign_new_league_member()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_season integer;v_group integer;
begin
  select season_number into v_season from public.league_state where id=1;
  select coalesce(min(group_no) filter(where member_count<15),max(group_no)+1,1) into v_group
  from (select group_no,count(*) member_count from public.league_members where league_level=1 and season_number=v_season group by group_no) x;
  insert into public.league_members(user_id,league_level,group_no,season_xp,season_number)
  values(new.id,1,coalesce(v_group,1),0,v_season) on conflict(user_id) do nothing;
  return new;
end $$;

drop trigger if exists profiles_assign_league_member on public.profiles;
create trigger profiles_assign_league_member after insert on public.profiles
for each row execute function public.assign_new_league_member();

create or replace function public.ensure_league_current()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_uid uuid:=auth.uid();v_state public.league_state;v_group integer;v_now timestamptz:=now();
begin
  if v_uid is null then raise exception 'Login required';end if;
  perform pg_advisory_xact_lock(847213013);
  select * into v_state from public.league_state where id=1 for update;
  if not found then
    insert into public.league_state(id,season_number,starts_at,ends_at) values(1,1,v_now,v_now+interval '13 days') returning * into v_state;
  end if;

  if v_now>=v_state.ends_at then
    insert into public.league_season_results(season_number,user_id,old_level,old_group,final_rank,final_xp,result,new_level)
    select v_state.season_number,m.user_id,m.league_level,m.group_no,
      row_number() over(partition by m.league_level,m.group_no order by m.season_xp desc,m.updated_at,m.user_id)::integer,
      m.season_xp,
      case
        when row_number() over(partition by m.league_level,m.group_no order by m.season_xp desc,m.updated_at,m.user_id)<=10 and m.league_level=10 then 'level_cap'
        when row_number() over(partition by m.league_level,m.group_no order by m.season_xp desc,m.updated_at,m.user_id)<=10 then 'promoted'
        when row_number() over(partition by m.league_level,m.group_no order by m.season_xp desc,m.updated_at,m.user_id)<=13 then 'safe'
        when m.league_level=1 then 'level_floor'
        else 'demoted' end,
      case
        when row_number() over(partition by m.league_level,m.group_no order by m.season_xp desc,m.updated_at,m.user_id)<=10 then least(10,m.league_level+1)
        when row_number() over(partition by m.league_level,m.group_no order by m.season_xp desc,m.updated_at,m.user_id)<=13 then m.league_level
        else greatest(1,m.league_level-1) end::smallint
    from public.league_members m
    where m.season_number=v_state.season_number
    on conflict(season_number,user_id) do nothing;

    with moved as (
      select r.user_id,r.new_level,p.name,
        row_number() over(partition by r.new_level order by r.final_xp desc,r.user_id) as level_position
      from public.league_season_results r left join public.profiles p on p.id=r.user_id
      where r.season_number=v_state.season_number
    )
    update public.league_members m set
      league_level=x.new_level,
      group_no=((x.level_position-1)/15+1)::integer,
      season_xp=0,
      season_number=v_state.season_number+1,
      updated_at=v_now
    from moved x where m.user_id=x.user_id;

    if to_regclass('public.hub_notifications') is not null then
      insert into public.hub_notifications(title,body,tag,action,metadata,created_by,expires_at)
      select case when r.result='promoted' then '🎉 League promotion!' when r.result='demoted' then 'League level changed' else 'New league season' end,
        case when r.result='promoted' then 'You reached Level '||r.new_level||'. Seasonal XP reset to 0.'
             when r.result='demoted' then 'You moved to Level '||r.new_level||'. Seasonal XP reset to 0.'
             else 'You remain in Level '||r.new_level||'. Seasonal XP reset to 0.' end,
        'league','leaderboard',jsonb_build_object('target_user_id',r.user_id::text,'season_number',v_state.season_number+1,'result',r.result),null,v_now+interval '14 days'
      from public.league_season_results r where r.season_number=v_state.season_number;
    end if;

    update public.league_state set season_number=v_state.season_number+1,starts_at=v_now,ends_at=v_now+interval '13 days',updated_at=v_now where id=1 returning * into v_state;
  end if;

  if not exists(select 1 from public.league_members where user_id=v_uid) then
    select coalesce(min(group_no) filter(where member_count<15),max(group_no)+1,1) into v_group
    from (select group_no,count(*) member_count from public.league_members where league_level=1 and season_number=v_state.season_number group by group_no) x;
    insert into public.league_members(user_id,league_level,group_no,season_xp,season_number)
    values(v_uid,1,coalesce(v_group,1),0,v_state.season_number) on conflict(user_id) do nothing;
  end if;

  return jsonb_build_object('season_number',v_state.season_number,'starts_at',v_state.starts_at,'ends_at',v_state.ends_at);
end $$;

create or replace function public.grant_league_xp(p_amount integer)
returns public.league_members language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_row public.league_members;
begin
  if v_uid is null then raise exception 'Login required';end if;
  if p_amount is null or p_amount<=0 or p_amount>5000 then raise exception 'Invalid XP amount';end if;
  perform public.ensure_league_current();
  update public.league_members set season_xp=season_xp+p_amount,updated_at=now() where user_id=v_uid returning * into v_row;
  return v_row;
end $$;

revoke all on function public.ensure_league_current() from public;
revoke all on function public.grant_league_xp(integer) from public;
grant execute on function public.ensure_league_current() to authenticated;
grant execute on function public.grant_league_xp(integer) to authenticated;

-- Optional: if pg_cron is enabled, uncomment to settle even when nobody opens the app.
-- select cron.schedule('rathod-league-settlement','15 * * * *','select public.ensure_league_current();');
