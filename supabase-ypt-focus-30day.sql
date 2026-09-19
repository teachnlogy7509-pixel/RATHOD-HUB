-- RATHOD HUB: YPT-style 30-day public study leaderboard + colorful anime avatars
-- 18 avatars total: 10 girls + 8 boys, unlocked by study done in the last 3 days.

insert into public.rh_shop_items (item_id, name, kind, emoji, price, description, tier, active)
values
  ('avatar_scholar','Haru Scholar','avatar','📘',2400,'Focused study boy avatar','24h',true),
  ('avatar_medic','Aiko Medic','avatar','🩺',2400,'Bright anime girl medic avatar','24h',true),
  ('avatar_girl_muse','Yuna Muse','avatar','🌸',2400,'Colorful anime girl muse avatar','24h',true),
  ('avatar_scientist','Luna Scientist','avatar','🧪',2700,'Curious anime girl scientist avatar','27h',true),
  ('avatar_warrior','Ren Warrior','avatar','⚡',2700,'Sharp anime boy warrior avatar','27h',true),
  ('avatar_boy_ace','Leo Ace','avatar','🍀',2700,'Fresh anime boy ace avatar','27h',true),
  ('avatar_phoenix','Sakura Phoenix','avatar','🔥',3000,'Colorful anime girl phoenix avatar','30h',true),
  ('avatar_rare_doctor_f','Kiara Care','avatar','💖',3000,'Premium anime girl doctor avatar','30h',true),
  ('avatar_boy_focus','Arjun Focus','avatar','🎯',3000,'Focused anime boy avatar','30h',true),
  ('avatar_rare_scientist_f','Mira Quantum','avatar','🌙',3300,'Premium anime girl scientist avatar','33h',true),
  ('avatar_boy_blaze','Kian Blaze','avatar','✨',3300,'Stylish anime boy blaze avatar','33h',true),
  ('avatar_girl_mint','Hina Mint','avatar','💎',3300,'Mint anime girl avatar','33h',true),
  ('avatar_rare_queen_f','Tara Crown','avatar','👑',3600,'Royal anime girl queen avatar','36h',true),
  ('avatar_boy_noir','Zayn Noir','avatar','♦️',3600,'Dark anime boy noir avatar','36h',true),
  ('avatar_girl_rose','Riya Rose','avatar','🌹',3600,'Rose anime girl avatar','36h',true),
  ('avatar_boy_sky','Dev Sky','avatar','🪽',4000,'Sky-themed anime boy avatar','40h',true),
  ('avatar_boy_storm','Max Storm','avatar','⛈️',4000,'Storm anime boy avatar','40h',true),
  ('avatar_girl_neon','Naina Neon','avatar','🎵',4000,'Neon anime girl avatar','40h',true)
on conflict (item_id) do update set
  name = excluded.name,
  kind = excluded.kind,
  emoji = excluded.emoji,
  price = excluded.price,
  description = excluded.description,
  tier = excluded.tier,
  active = excluded.active;

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
        ('avatar_medic', 86400),
        ('avatar_girl_muse', 86400),
        ('avatar_scientist', 97200),
        ('avatar_warrior', 97200),
        ('avatar_boy_ace', 97200),
        ('avatar_phoenix', 108000),
        ('avatar_rare_doctor_f', 108000),
        ('avatar_boy_focus', 108000),
        ('avatar_rare_scientist_f', 118800),
        ('avatar_boy_blaze', 118800),
        ('avatar_girl_mint', 118800),
        ('avatar_rare_queen_f', 129600),
        ('avatar_boy_noir', 129600),
        ('avatar_girl_rose', 129600),
        ('avatar_boy_sky', 144000),
        ('avatar_boy_storm', 144000),
        ('avatar_girl_neon', 144000)
      ) as milestone(item_id, target_seconds)
     order by target_seconds, item_id
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
  with config(item_id, target_seconds, tier_label, rule_text, sort_order) as (
    values
      ('avatar_scholar', 86400, '24h', '3 days me 24+ hours focus', 1),
      ('avatar_medic', 86400, '24h', '3 days me 24+ hours focus', 2),
      ('avatar_girl_muse', 86400, '24h', '3 days me 24+ hours focus', 3),
      ('avatar_scientist', 97200, '27h', '3 days me 27+ hours focus', 4),
      ('avatar_warrior', 97200, '27h', '3 days me 27+ hours focus', 5),
      ('avatar_boy_ace', 97200, '27h', '3 days me 27+ hours focus', 6),
      ('avatar_phoenix', 108000, '30h', '3 days me 30+ hours focus', 7),
      ('avatar_rare_doctor_f', 108000, '30h', '3 days me 30+ hours focus', 8),
      ('avatar_boy_focus', 108000, '30h', '3 days me 30+ hours focus', 9),
      ('avatar_rare_scientist_f', 118800, '33h', '3 days me 33+ hours focus', 10),
      ('avatar_boy_blaze', 118800, '33h', '3 days me 33+ hours focus', 11),
      ('avatar_girl_mint', 118800, '33h', '3 days me 33+ hours focus', 12),
      ('avatar_rare_queen_f', 129600, '36h', '3 days me 36+ hours focus', 13),
      ('avatar_boy_noir', 129600, '36h', '3 days me 36+ hours focus', 14),
      ('avatar_girl_rose', 129600, '36h', '3 days me 36+ hours focus', 15),
      ('avatar_boy_sky', 144000, '40h', '3 days me 40+ hours focus', 16),
      ('avatar_boy_storm', 144000, '40h', '3 days me 40+ hours focus', 17),
      ('avatar_girl_neon', 144000, '40h', '3 days me 40+ hours focus', 18)
  ), items as (
    select c.item_id, c.target_seconds, c.tier_label, c.rule_text, c.sort_order, s.name, s.emoji, s.description
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
        'remaining_seconds', greatest(items.target_seconds - v_total, 0),
        'progress_percent', least(100, greatest(0, round((v_total::numeric / nullif(items.target_seconds, 0)::numeric) * 100, 1)))
      )
      order by items.sort_order
    )
  from items;
end;
$$;

revoke all on function public.ensure_focus_avatar_rewards() from public;
revoke all on function public.get_focus_avatar_status() from public;
grant execute on function public.ensure_focus_avatar_rewards(), public.get_focus_avatar_status() to authenticated;
