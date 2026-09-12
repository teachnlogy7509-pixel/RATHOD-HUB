-- RATHOD HUB: one-time wisdom choice + secure premium XP shop
-- Run once in Supabase SQL Editor.

create table if not exists public.user_wisdom_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preference text not null check (preference in ('sanatan','islamic','sikh','christian','buddhist_jain','universal')),
  chosen_at timestamptz not null default now()
);
alter table public.user_wisdom_preferences enable row level security;
drop policy if exists "wisdom own read" on public.user_wisdom_preferences;
create policy "wisdom own read" on public.user_wisdom_preferences for select to authenticated using (auth.uid()=user_id);

create or replace function public.choose_wisdom_preference(p_preference text)
returns public.user_wisdom_preferences
language plpgsql security definer set search_path=public
as $$
declare out_row public.user_wisdom_preferences;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if p_preference not in ('sanatan','islamic','sikh','christian','buddhist_jain','universal') then raise exception 'Invalid preference'; end if;
  insert into public.user_wisdom_preferences(user_id,preference) values(auth.uid(),p_preference)
  on conflict (user_id) do nothing returning * into out_row;
  if out_row.user_id is null then raise exception 'Preference already locked'; end if;
  return out_row;
end $$;
grant execute on function public.choose_wisdom_preference(text) to authenticated;

create or replace function public.admin_reset_wisdom_preference(p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin only'; end if;
  delete from public.user_wisdom_preferences where user_id=p_user_id;
  return true;
end $$;
grant execute on function public.admin_reset_wisdom_preference(uuid) to authenticated;

create table if not exists public.rh_shop_items (
  item_id text primary key,
  name text not null,
  kind text not null check(kind in ('avatar','badge','streak')),
  emoji text not null,
  price integer not null check(price>0),
  description text not null default '',
  tier text not null default 'Premium',
  active boolean not null default true
);
insert into public.rh_shop_items(item_id,name,kind,emoji,price,description,tier) values
 ('avatar_scholar','Scholar Avatar','avatar','🎓',500,'Focused learner look','Starter'),
 ('badge_rising','Rising Scholar','badge','✦',800,'Name ke peeche Rising Scholar','Starter'),
 ('avatar_medic','Future Doctor','avatar','🩺',900,'NEET aspirant premium avatar','Starter'),
 ('streak_shield','Streak Shield','streak','🛡️',1000,'Ek missed day par streak bachaye','Utility'),
 ('avatar_scientist','Bio Scientist','avatar','🧬',1400,'Biology explorer avatar','Pro'),
 ('badge_ncert','NCERT Master','badge','📚',1500,'NCERT Master name badge','Pro'),
 ('avatar_warrior','Study Warrior','avatar','⚔️',2000,'Daily battle champion avatar','Pro'),
 ('badge_focus','Focus Elite','badge','⚡',2500,'Focus Elite name badge','Elite'),
 ('avatar_phoenix','Phoenix','avatar','🔥',2800,'Comeback specialist avatar','Elite'),
 ('badge_neet','NEET Pro','badge','💎',3500,'Premium NEET Pro badge','Elite'),
 ('badge_legend','League Legend','badge','👑',5000,'Ultimate premium name badge','Legend')
on conflict(item_id) do update set name=excluded.name,kind=excluded.kind,emoji=excluded.emoji,price=excluded.price,description=excluded.description,tier=excluded.tier,active=true;
alter table public.rh_shop_items enable row level security;
drop policy if exists "shop catalog read" on public.rh_shop_items;
create policy "shop catalog read" on public.rh_shop_items for select to authenticated using(active);

create table if not exists public.rh_shop_purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.rh_shop_items(item_id),
  paid_xp integer not null,
  purchased_at timestamptz not null default now()
);
create unique index if not exists rh_one_cosmetic_per_user on public.rh_shop_purchases(user_id,item_id) where item_id <> 'streak_shield';
alter table public.rh_shop_purchases enable row level security;
drop policy if exists "shop purchases own read" on public.rh_shop_purchases;
create policy "shop purchases own read" on public.rh_shop_purchases for select to authenticated using(auth.uid()=user_id);

create table if not exists public.profile_cosmetics (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  equipped_avatar text references public.rh_shop_items(item_id),
  equipped_badge text references public.rh_shop_items(item_id),
  streak_shields integer not null default 0 check(streak_shields>=0),
  updated_at timestamptz not null default now()
);
alter table public.profile_cosmetics enable row level security;
drop policy if exists "cosmetics authenticated read" on public.profile_cosmetics;
create policy "cosmetics authenticated read" on public.profile_cosmetics for select to authenticated using(true);

create or replace function public.buy_profile_shop_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_item public.rh_shop_items; v_xp integer; v_owned boolean;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_item from public.rh_shop_items where item_id=p_item_id and active=true;
  if not found then raise exception 'Item not found'; end if;
  select coalesce(xp,0)::integer into v_xp from public.profiles where id=auth.uid() for update;
  if v_xp < v_item.price then raise exception 'Not enough XP'; end if;
  if v_item.kind <> 'streak' then
    select exists(select 1 from public.rh_shop_purchases where user_id=auth.uid() and item_id=p_item_id) into v_owned;
    if v_owned then raise exception 'Item already owned'; end if;
  end if;
  update public.profiles set xp=v_xp-v_item.price where id=auth.uid();
  insert into public.rh_shop_purchases(user_id,item_id,paid_xp) values(auth.uid(),p_item_id,v_item.price);
  insert into public.profile_cosmetics(user_id,streak_shields) values(auth.uid(),case when v_item.kind='streak' then 1 else 0 end)
  on conflict(user_id) do update set streak_shields=public.profile_cosmetics.streak_shields+case when v_item.kind='streak' then 1 else 0 end,updated_at=now();
  return jsonb_build_object('item_id',p_item_id,'xp',v_xp-v_item.price,'kind',v_item.kind);
end $$;
grant execute on function public.buy_profile_shop_item(text) to authenticated;

create or replace function public.equip_profile_shop_item(p_item_id text)
returns public.profile_cosmetics language plpgsql security definer set search_path=public
as $$
declare v_item public.rh_shop_items; out_row public.profile_cosmetics;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_item from public.rh_shop_items where item_id=p_item_id and kind in ('avatar','badge') and active=true;
  if not found then raise exception 'Cosmetic not found'; end if;
  if not exists(select 1 from public.rh_shop_purchases where user_id=auth.uid() and item_id=p_item_id) then raise exception 'Buy this item first'; end if;
  insert into public.profile_cosmetics(user_id,equipped_avatar,equipped_badge)
  values(auth.uid(),case when v_item.kind='avatar' then p_item_id end,case when v_item.kind='badge' then p_item_id end)
  on conflict(user_id) do update set
    equipped_avatar=case when v_item.kind='avatar' then p_item_id else public.profile_cosmetics.equipped_avatar end,
    equipped_badge=case when v_item.kind='badge' then p_item_id else public.profile_cosmetics.equipped_badge end,
    updated_at=now()
  returning * into out_row;
  return out_row;
end $$;
grant execute on function public.equip_profile_shop_item(text) to authenticated;

grant select on public.user_wisdom_preferences to authenticated;
grant select on public.rh_shop_items to authenticated;
grant select on public.rh_shop_purchases to authenticated;
grant select on public.profile_cosmetics to authenticated;
