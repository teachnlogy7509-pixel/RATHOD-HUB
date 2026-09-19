-- RATHOD HUB: YPT-style 30-day public study leaderboard + earned avatars
-- Run once in Supabase SQL Editor after focus_sessions, profiles, rh_shop_items and profile_cosmetics exist.

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
     where c.cycle_id = true;
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

drop function if exists public.get_ypt_focus_leaderboard(integer);
create function public.get_ypt_focus_leaderboard(p_limit integer default 100)
returns table(
  rank bigint,
  user_id uuid,
  name text,
  pfp_url text,
  avatar_item_id text,
  avatar_emoji text,
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
      avatar.item_id::text as equipped_avatar_item_id,
      avatar.emoji::text as equipped_avatar_emoji,
      ut.total_seconds,
      ut.session_count,
      coalesce(sl.subjects, '[]'::jsonb) as subject_list
    from user_totals ut
    left join public.profiles p on p.id = ut.user_id
    left join public.profile_cosmetics pc on pc.user_id = ut.user_id
    left join public.rh_shop_items avatar on avatar.item_id = pc.equipped_avatar and avatar.kind = 'avatar' and avatar.active = true
    left join subject_lists sl on sl.user_id = ut.user_id
  )
  select
    r.user_rank,
    r.user_id,
    r.display_name,
    r.pfp_url,
    r.equipped_avatar_item_id,
    r.equipped_avatar_emoji,
    r.total_seconds,
    r.session_count,
    r.subject_list
  from ranked r
  where r.user_rank <= greatest(1, least(coalesce(p_limit, 100), 500))
  order by r.user_rank, r.total_seconds desc, r.display_name;
end;
$$;

drop function if exists public.ensure_focus_avatar_rewards();
create function public.ensure_focus_avatar_rewards()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total bigint := 0;
  v_equipped text;
  v_default_avatar text;
  v_unlocked text[] := '{}'::text[];
  rec record;
begin
  if v_user is null then
    raise exception 'Login required';
  end if;

  select coalesce(sum(greatest(coalesce(fs.seconds, 0), 0)), 0)::bigint
    into v_total
    from public.focus_sessions fs
   where fs.user_id = v_user
     and fs.date >= current_date - 2
     and fs.date < current_date + 1;

  for rec in
    select *
      from (values
        ('avatar_scholar', 86400),
        ('avatar_medic', 129600),
        ('avatar_scientist', 172800),
        ('avatar_warrior', 216000),
        ('avatar_phoenix', 259200)
      ) as milestone(item_id, target_seconds)
     order by target_seconds
  loop
    if v_total >= rec.target_seconds then
      insert into public.rh_shop_purchases(user_id, item_id, paid_xp)
      values (v_user, rec.item_id, 0)
      on conflict do nothing;
      v_unlocked := array_append(v_unlocked, rec.item_id);
    end if;
  end loop;

  insert into public.profile_cosmetics(user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  select pc.equipped_avatar
    into v_equipped
    from public.profile_cosmetics pc
   where pc.user_id = v_user;

  if coalesce(array_length(v_unlocked, 1), 0) > 0 and (v_equipped is null or array_position(v_unlocked, v_equipped) is null) then
    v_default_avatar := v_unlocked[array_length(v_unlocked, 1)];
    update public.profile_cosmetics
       set equipped_avatar = v_default_avatar,
           updated_at = now()
     where user_id = v_user;
    v_equipped := v_default_avatar;
  end if;

  return jsonb_build_object(
    'total_seconds', v_total,
    'equipped_avatar', v_equipped,
    'unlocked_item_ids', to_jsonb(v_unlocked)
  );
end;
$$;


drop function if exists public.get_focus_avatar_status();
create function public.get_focus_avatar_status()
returns table(
  total_seconds bigint,
  unlocked_count integer,
  equipped_avatar text,
  avatars jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state jsonb;
  v_total bigint := 0;
  v_equipped text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  v_state := public.ensure_focus_avatar_rewards();
  v_total := coalesce((v_state->>'total_seconds')::bigint, 0);
  v_equipped := nullif(v_state->>'equipped_avatar', '');

  return query
  with config(item_id, target_seconds, tier_label, rule_text) as (
    values
      ('avatar_scholar', 86400, '24h', '3 days me 24+ hours focus'),
      ('avatar_medic', 129600, '36h', '3 days me 36+ hours focus'),
      ('avatar_scientist', 172800, '48h', '3 days me 48+ hours focus'),
      ('avatar_warrior', 216000, '60h', '3 days me 60+ hours focus'),
      ('avatar_phoenix', 259200, '72h', '3 days me 72+ hours focus')
  ), items as (
    select
      c.item_id,
      c.target_seconds,
      c.tier_label,
      c.rule_text,
      s.name,
      s.emoji,
      s.description
    from config c
    join public.rh_shop_items s on s.item_id = c.item_id
  )
  select
    v_total,
    jsonb_array_length(coalesce(v_state->'unlocked_item_ids', '[]'::jsonb))::integer,
    v_equipped,
    jsonb_agg(
      jsonb_build_object(
        'item_id', items.item_id,
        'name', items.name,
        'emoji', items.emoji,
        'description', items.description,
        'target_seconds', items.target_seconds,
        'target_hours', round((items.target_seconds / 3600.0)::numeric, 1),
        'tier_label', items.tier_label,
        'rule_text', items.rule_text,
        'unlocked', coalesce((v_state->'unlocked_item_ids') ? items.item_id, false),
        'equipped', items.item_id = v_equipped,
        'remaining_seconds', greatest(items.target_seconds - v_total, 0)
      )
      order by items.target_seconds
    )
  from items;
end;
$$;

drop function if exists public.equip_focus_avatar(text);
create function public.equip_focus_avatar(p_item_id text)
returns public.profile_cosmetics
language plpgsql
security definer
set search_path = public
as $$
declare
  out_row public.profile_cosmetics;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  perform public.ensure_focus_avatar_rewards();

  if not exists (
    select 1
      from public.rh_shop_items s
     where s.item_id = p_item_id
       and s.kind = 'avatar'
       and s.active = true
  ) then
    raise exception 'Avatar not found';
  end if;

  if not exists (
    select 1
      from public.rh_shop_purchases p
     where p.user_id = auth.uid()
       and p.item_id = p_item_id
  ) then
    raise exception 'Avatar abhi unlock nahi hua';
  end if;

  insert into public.profile_cosmetics(user_id, equipped_avatar)
  values (auth.uid(), p_item_id)
  on conflict (user_id) do update set
    equipped_avatar = excluded.equipped_avatar,
    updated_at = now()
  returning * into out_row;

  return out_row;
end;
$$;

revoke all on function public.ensure_ypt_focus_cycle() from public;
revoke all on function public.get_ypt_focus_cycle() from public;
revoke all on function public.get_ypt_focus_leaderboard(integer) from public;
revoke all on function public.ensure_focus_avatar_rewards() from public;
revoke all on function public.get_focus_avatar_status() from public;
revoke all on function public.equip_focus_avatar(text) from public;

grant execute on function public.ensure_ypt_focus_cycle(), public.get_ypt_focus_cycle(), public.get_ypt_focus_leaderboard(integer) to authenticated;
grant execute on function public.ensure_focus_avatar_rewards(), public.get_focus_avatar_status(), public.equip_focus_avatar(text) to authenticated;
