-- RATHOD HUB: YPT-style 30-day public study leaderboard
-- Run once in Supabase SQL Editor after focus_sessions and profiles exist.
-- Sessions are never deleted; the visible leaderboard rolls to zero every 30 days.

create table if not exists public.ypt_focus_cycle (
  cycle_id boolean primary key default true check (cycle_id = true),
  cycle_start date not null,
  cycle_end date not null,
  updated_at timestamptz not null default now(),
  check (cycle_end > cycle_start)
);

insert into public.ypt_focus_cycle(cycle_id, cycle_start, cycle_end)
values (true, current_date, current_date + 30)
on conflict (cycle_id) do nothing;

create or replace function public.ensure_ypt_focus_cycle()
returns table(cycle_start date, cycle_end date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;
  v_shift integer;
begin
  select c.cycle_start, c.cycle_end
    into v_start, v_end
    from public.ypt_focus_cycle c
   where c.cycle_id = true
   for update;

  if not found then
    v_start := current_date;
    v_end := current_date + 30;
    insert into public.ypt_focus_cycle(cycle_id, cycle_start, cycle_end)
    values (true, v_start, v_end);
  elsif current_date >= v_end then
    v_shift := greatest(1, (current_date - v_start) / 30);
    v_start := v_start + (v_shift * 30);
    v_end := v_start + 30;
    update public.ypt_focus_cycle
       set cycle_start = v_start,
           cycle_end = v_end,
           updated_at = now()
     where cycle_id = true;
  end if;

  return query select v_start, v_end;
end;
$$;

create or replace function public.get_ypt_focus_cycle()
returns table(cycle_start date, cycle_end date, days_left integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;
begin
  select c.cycle_start, c.cycle_end
    into v_start, v_end
    from public.ensure_ypt_focus_cycle() c;
  return query
  select v_start, v_end, greatest(0, (v_end - current_date))::integer;
end;
$$;

create or replace function public.get_ypt_focus_leaderboard(p_limit integer default 100)
returns table(
  rank bigint,
  user_id uuid,
  name text,
  pfp_url text,
  total_seconds bigint,
  session_count bigint,
  subjects jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with cycle as (
    select * from public.ensure_ypt_focus_cycle()
  ), session_rows as (
    select
      fs.user_id,
      coalesce(nullif(trim(fs.subject), ''), 'Other') as subject,
      greatest(coalesce(fs.seconds, 0), 0)::bigint as seconds
    from public.focus_sessions fs
    cross join cycle c
    where fs.date >= c.cycle_start
      and fs.date < c.cycle_end
  ), user_totals as (
    select
      s.user_id,
      sum(s.seconds)::bigint as total_seconds,
      count(*)::bigint as session_count
    from session_rows s
    group by s.user_id
  ), subject_totals as (
    select s.user_id, s.subject, sum(s.seconds)::bigint as subject_seconds
    from session_rows s
    group by s.user_id, s.subject
  ), subject_lists as (
    select
      st.user_id,
      jsonb_agg(
        jsonb_build_object('subject', st.subject, 'seconds', st.subject_seconds)
        order by st.subject_seconds desc, st.subject
      ) as subjects
    from subject_totals st
    group by st.user_id
  ), ranked as (
    select
      dense_rank() over (order by ut.total_seconds desc)::bigint as user_rank,
      ut.user_id,
      coalesce(nullif(trim(p.name), ''), 'Aspirant')::text as display_name,
      p.pfp_url::text,
      ut.total_seconds,
      ut.session_count,
      coalesce(sl.subjects, '[]'::jsonb) as subject_list
    from user_totals ut
    left join public.profiles p on p.id = ut.user_id
    left join subject_lists sl on sl.user_id = ut.user_id
  )
  select
    r.user_rank,
    r.user_id,
    r.display_name,
    r.pfp_url,
    r.total_seconds,
    r.session_count,
    r.subject_list
  from ranked r
  where r.user_rank <= greatest(1, least(coalesce(p_limit, 100), 500))
  order by r.user_rank, r.total_seconds desc, r.display_name;
end;
$$;

revoke all on function public.ensure_ypt_focus_cycle() from public;
revoke all on function public.get_ypt_focus_cycle() from public;
revoke all on function public.get_ypt_focus_leaderboard(integer) from public;
grant execute on function public.ensure_ypt_focus_cycle(), public.get_ypt_focus_cycle(), public.get_ypt_focus_leaderboard(integer) to authenticated;
