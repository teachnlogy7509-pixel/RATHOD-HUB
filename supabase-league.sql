-- RATHOD HUB 13-day League + Council Rewards
-- Run this complete file once in Supabase SQL Editor as project owner.

create extension if not exists pgcrypto;

create table if not exists public.league_state (
  id smallint primary key default 1 check (id = 1),
  season_number integer not null default 1,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '13 days'),
  updated_at timestamptz not null default now()
);
insert into public.league_state(id,season_number,starts_at,ends_at)
values(1,1,now(),now()+interval '13 days') on conflict (id) do nothing;

create table if not exists public.league_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  league_level smallint not null default 1 check (league_level between 1 and 10),
  group_no integer not null default 1 check (group_no >= 1),
  season_xp integer not null default 0 check (season_xp >= 0),
  season_number integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists league_members_board_idx on public.league_members(season_number,league_level,group_no,season_xp desc,updated_at,user_id);

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

create table if not exists public.league_rewards (
  id uuid primary key default gen_random_uuid(),
  season_number integer not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  final_rank smallint not null check(final_rank between 1 and 3),
  league_level smallint not null check(league_level between 1 and 10),
  council_role text not null check(council_role in ('league_captain','elite_mentor','community_star')),
  chest text not null check(chest in ('Starter Chest','Pro Chest','Elite Chest','Legend Trophy')),
  wallet_xp integer not null default 0,
  spin_tickets integer not null default 0,
  ai_credits integer not null default 0,
  streak_cards integer not null default 0,
  badge text not null,
  frame_style text not null,
  name_color text not null,
  access_expires_at timestamptz not null,
  wallet_awarded boolean not null default false,
  inventory_applied boolean not null default false,
  created_at timestamptz not null default now(),
  unique(season_number,user_id)
);
create index if not exists league_rewards_active_idx on public.league_rewards(user_id,access_expires_at desc);

create table if not exists public.league_inventory (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  spin_tickets integer not null default 0 check(spin_tickets >= 0),
  ai_credits integer not null default 0 check(ai_credits >= 0),
  streak_cards integer not null default 0 check(streak_cards >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_permanent_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge text not null,
  earned_in_season integer not null,
  created_at timestamptz not null default now(),
  primary key(user_id,badge)
);

create table if not exists public.league_lounge_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check(char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists league_lounge_recent_idx on public.league_lounge_messages(created_at desc);

alter table public.league_state enable row level security;
alter table public.league_members enable row level security;
alter table public.league_season_results enable row level security;
alter table public.league_rewards enable row level security;
alter table public.league_inventory enable row level security;
alter table public.league_permanent_badges enable row level security;
alter table public.league_lounge_messages enable row level security;

drop policy if exists league_state_read on public.league_state;
create policy league_state_read on public.league_state for select to authenticated using (true);
drop policy if exists league_members_read on public.league_members;
create policy league_members_read on public.league_members for select to authenticated using (true);
drop policy if exists league_results_read_own on public.league_season_results;
create policy league_results_read_own on public.league_season_results for select to authenticated using (user_id=auth.uid());
drop policy if exists league_rewards_read on public.league_rewards;
create policy league_rewards_read on public.league_rewards for select to authenticated using (true);
drop policy if exists league_inventory_read_own on public.league_inventory;
create policy league_inventory_read_own on public.league_inventory for select to authenticated using(user_id=auth.uid());
drop policy if exists league_badges_read on public.league_permanent_badges;
create policy league_badges_read on public.league_permanent_badges for select to authenticated using(true);
drop policy if exists league_lounge_read_active on public.league_lounge_messages;
create policy league_lounge_read_active on public.league_lounge_messages for select to authenticated using(
  exists(select 1 from public.league_rewards r where r.user_id=auth.uid() and r.access_expires_at>now())
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);
drop policy if exists league_lounge_write_active on public.league_lounge_messages;
create policy league_lounge_write_active on public.league_lounge_messages for insert to authenticated with check(
  user_id=auth.uid() and (exists(select 1 from public.league_rewards r where r.user_id=auth.uid() and r.access_expires_at>now())
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
);

grant select on public.league_state,public.league_members,public.league_season_results,public.league_rewards,public.league_inventory,public.league_permanent_badges,public.league_lounge_messages to authenticated;
grant insert on public.league_lounge_messages to authenticated;

-- First installation only: top 15 lifetime-XP users begin at Level 2, others at Level 1.
with overall as (
  select p.id,p.xp,row_number() over(order by coalesce(p.xp,0) desc,p.id) as overall_rank from public.profiles p
), assigned as (
  select id,case when overall_rank<=15 then 2 else 1 end::smallint as league_level,coalesce(xp,0) as old_xp from overall
), grouped as (
  select id,league_level,((row_number() over(partition by league_level order by old_xp desc,id)-1)/15+1)::integer as group_no from assigned
)
insert into public.league_members(user_id,league_level,group_no,season_xp,season_number)
select g.id,g.league_level,g.group_no,0,1 from grouped g where not exists(select 1 from public.league_members)
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
create trigger profiles_assign_league_member after insert on public.profiles for each row execute function public.assign_new_league_member();

create or replace function public.ensure_league_current()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_state public.league_state;v_group integer;v_now timestamptz:=now();
begin
  if v_uid is null then raise exception 'Login required';end if;
  perform pg_advisory_xact_lock(847213013);
  select * into v_state from public.league_state where id=1 for update;
  if not found then insert into public.league_state(id,season_number,starts_at,ends_at) values(1,1,v_now,v_now+interval '13 days') returning * into v_state;end if;

  if v_now>=v_state.ends_at then
    insert into public.league_season_results(season_number,user_id,old_level,old_group,final_rank,final_xp,result,new_level)
    select v_state.season_number,m.user_id,m.league_level,m.group_no,rnk,m.season_xp,
      case when rnk<=10 and m.league_level=10 then 'level_cap' when rnk<=10 then 'promoted' when rnk<=13 then 'safe' when m.league_level=1 then 'level_floor' else 'demoted' end,
      case when rnk<=10 then least(10,m.league_level+1) when rnk<=13 then m.league_level else greatest(1,m.league_level-1) end::smallint
    from public.league_members m
    cross join lateral (
      select count(*)::integer+1 as rnk from public.league_members x
      where x.season_number=m.season_number and x.league_level=m.league_level and x.group_no=m.group_no
        and (x.season_xp>m.season_xp or (x.season_xp=m.season_xp and (x.updated_at<m.updated_at or (x.updated_at=m.updated_at and x.user_id<m.user_id))))
    ) q
    where m.season_number=v_state.season_number
    on conflict(season_number,user_id) do nothing;

    -- Top-3 earn Council access only after at least 100 Season XP. Rewards never add Season XP.
    insert into public.league_rewards(season_number,user_id,final_rank,league_level,council_role,chest,wallet_xp,spin_tickets,ai_credits,streak_cards,badge,frame_style,name_color,access_expires_at)
    select r.season_number,r.user_id,r.final_rank,r.old_level,
      case r.final_rank when 1 then 'league_captain' when 2 then 'elite_mentor' else 'community_star' end,
      case when r.old_level<=3 then 'Starter Chest' when r.old_level<=6 then 'Pro Chest' when r.old_level<=9 then 'Elite Chest' else 'Legend Trophy' end,
      case r.final_rank when 1 then 500 when 2 then 300 else 200 end,
      case r.final_rank when 1 then 3 when 2 then 2 else 1 end,
      case r.final_rank when 1 then 3 when 2 then 2 else 1 end,
      1,
      case r.final_rank when 1 then 'League Captain' when 2 then 'Elite Mentor' else 'Community Star' end,
      case r.final_rank when 1 then 'gold' when 2 then 'silver' else 'bronze' end,
      case r.final_rank when 1 then '#fbbf24' when 2 then '#cbd5e1' else '#fb923c' end,
      v_now+interval '13 days'
    from public.league_season_results r
    where r.season_number=v_state.season_number and r.final_rank<=3 and r.final_xp>=100
    on conflict(season_number,user_id) do nothing;

    with paid as (
      update public.league_rewards set wallet_awarded=true
      where season_number=v_state.season_number and wallet_awarded=false returning user_id,wallet_xp
    )
    update public.profiles p set xp=coalesce(p.xp,0)+paid.wallet_xp from paid where p.id=paid.user_id;

    with applied as (
      update public.league_rewards set inventory_applied=true
      where season_number=v_state.season_number and inventory_applied=false returning user_id,spin_tickets,ai_credits,streak_cards
    )
    insert into public.league_inventory(user_id,spin_tickets,ai_credits,streak_cards)
    select user_id,spin_tickets,ai_credits,streak_cards from applied
    on conflict(user_id) do update set
      spin_tickets=public.league_inventory.spin_tickets+excluded.spin_tickets,
      ai_credits=public.league_inventory.ai_credits+excluded.ai_credits,
      streak_cards=public.league_inventory.streak_cards+excluded.streak_cards,updated_at=v_now;

    insert into public.league_permanent_badges(user_id,badge,earned_in_season)
    select user_id,'League Legend',season_number from public.league_season_results
    where season_number=v_state.season_number and old_level=10 and final_rank=1 and final_xp>=100
    on conflict(user_id,badge) do nothing;

    with moved as (
      select r.user_id,r.new_level,row_number() over(partition by r.new_level order by r.final_xp desc,r.user_id) as level_position
      from public.league_season_results r where r.season_number=v_state.season_number
    )
    update public.league_members m set league_level=x.new_level,group_no=((x.level_position-1)/15+1)::integer,
      season_xp=0,season_number=v_state.season_number+1,updated_at=v_now from moved x where m.user_id=x.user_id;

    if to_regclass('public.hub_notifications') is not null then
      insert into public.hub_notifications(title,body,tag,action,metadata,created_by,expires_at)
      select case when r.final_rank<=3 and r.final_xp>=100 then '🏆 League Council reward!'
                  when r.result='promoted' then '🎉 League promotion!' when r.result='demoted' then 'League level changed' else 'New league season' end,
        case when r.final_rank<=3 and r.final_xp>=100 then 'Rank #'||r.final_rank||' reward unlocked. Wallet XP, chest and Council access are ready.'
             when r.result='promoted' then 'You reached Level '||r.new_level||'. Season XP reset to 0.'
             when r.result='demoted' then 'You moved to Level '||r.new_level||'. Season XP reset to 0.'
             else 'You remain in Level '||r.new_level||'. Season XP reset to 0.' end,
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
  insert into public.league_inventory(user_id) values(v_uid) on conflict(user_id) do nothing;
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

create or replace function public.use_league_spin_ticket()
returns integer language plpgsql security definer set search_path=public as $$
declare v_left integer;
begin
  update public.league_inventory set spin_tickets=spin_tickets-1,updated_at=now()
  where user_id=auth.uid() and spin_tickets>0 returning spin_tickets into v_left;
  if v_left is null then raise exception 'No bonus spin ticket available';end if;
  return v_left;
end $$;

revoke all on function public.ensure_league_current() from public;
revoke all on function public.grant_league_xp(integer) from public;
revoke all on function public.use_league_spin_ticket() from public;
grant execute on function public.ensure_league_current() to authenticated;
grant execute on function public.grant_league_xp(integer) to authenticated;
grant execute on function public.use_league_spin_ticket() to authenticated;

-- Optional with pg_cron: settlement still works automatically when the first user opens the app.
-- select cron.schedule('rathod-league-settlement','15 * * * *','select public.ensure_league_current();');
