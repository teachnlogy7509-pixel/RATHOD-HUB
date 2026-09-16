-- RATHOD HUB: referral rewards
-- Run once in Supabase SQL Editor after the existing profile/coupon/league SQL.
-- Both the referred user and the owner of the link receive 7 days of premium access.
-- The referrer also receives exactly 5,000 profile XP for each unique successful referral.

create extension if not exists pgcrypto;

create table if not exists public.hub_referral_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.hub_referral_codes(code),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  access_expires_at timestamptz not null,
  referrer_access_expires_at timestamptz,
  reward_xp integer not null default 5000 check (reward_xp=5000),
  created_at timestamptz not null default now(),
  unique(referrer_id,referred_user_id)
);

alter table public.hub_referrals
  add column if not exists referrer_access_expires_at timestamptz;

create index if not exists hub_referrals_referrer_idx
  on public.hub_referrals(referrer_id,created_at desc);
create index if not exists hub_referrals_access_idx
  on public.hub_referrals(referred_user_id,access_expires_at desc);
create index if not exists hub_referrals_referrer_access_idx
  on public.hub_referrals(referrer_id,referrer_access_expires_at desc);

alter table public.hub_referral_codes enable row level security;
alter table public.hub_referrals enable row level security;

drop policy if exists hub_referral_code_own_read on public.hub_referral_codes;
create policy hub_referral_code_own_read
  on public.hub_referral_codes for select to authenticated
  using (user_id=auth.uid());

drop policy if exists hub_referral_own_read on public.hub_referrals;
create policy hub_referral_own_read
  on public.hub_referrals for select to authenticated
  using (referrer_id=auth.uid() or referred_user_id=auth.uid());

grant select on public.hub_referral_codes,public.hub_referrals to authenticated;

create or replace function public.get_or_create_hub_referral_code()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_code text;
begin
  if v_uid is null then raise exception 'Login required'; end if;
  select code into v_code from public.hub_referral_codes where user_id=v_uid;
  if v_code is null then
    loop
      v_code:='RH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
      begin
        insert into public.hub_referral_codes(user_id,code)
        values(v_uid,v_code);
        exit;
      exception when unique_violation then
        v_code:=null;
      end;
    end loop;
  end if;
  return jsonb_build_object('success',true,'code',v_code);
end
$$;

create or replace function public.get_hub_referral_dashboard()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text;
  v_count integer;
  v_xp integer;
  v_last timestamptz;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select code into v_code from public.hub_referral_codes where user_id=auth.uid();
  select count(*)::integer,coalesce(sum(reward_xp),0)::integer,max(created_at)
    into v_count,v_xp,v_last
    from public.hub_referrals
   where referrer_id=auth.uid();
  return jsonb_build_object(
    'success',true,
    'code',v_code,
    'successful_referrals',v_count,
    'xp_earned',v_xp,
    'last_referral_at',v_last
  );
end
$$;

create or replace function public.claim_hub_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_code text:=upper(trim(coalesce(p_code,'')));
  v_referrer uuid;
  v_referral_id uuid;
  v_existing public.hub_referrals;
  v_expires timestamptz;
  v_new_xp integer;
  v_reward integer:=5000;
begin
  if v_uid is null then raise exception 'Login required'; end if;
  if v_code='' then return jsonb_build_object('success',false,'error','Referral code is required'); end if;

  select code,user_id into v_code,v_referrer
    from public.hub_referral_codes
   where code=v_code;
  if v_referrer is null then
    return jsonb_build_object('success',false,'error','Referral code invalid');
  end if;
  if v_referrer=v_uid then
    return jsonb_build_object('success',false,'error','You cannot use your own referral code');
  end if;

  select * into v_existing
    from public.hub_referrals
   where referred_user_id=v_uid;
  if found then
    return jsonb_build_object(
      'success',true,
      'already_claimed',true,
      'premium_expires_at',v_existing.access_expires_at,
      'referrer_premium_expires_at',v_existing.referrer_access_expires_at,
      'referrer_reward_xp',0
    );
  end if;

  v_expires:=now()+interval '7 days';
  insert into public.hub_referrals(
    referral_code,referrer_id,referred_user_id,access_expires_at,
    referrer_access_expires_at,reward_xp
  ) values(v_code,v_referrer,v_uid,v_expires,v_expires,v_reward)
  on conflict(referred_user_id) do nothing
  returning id into v_referral_id;

  if v_referral_id is null then
    select * into v_existing from public.hub_referrals where referred_user_id=v_uid;
    return jsonb_build_object(
      'success',true,
      'already_claimed',true,
      'premium_expires_at',v_existing.access_expires_at,
      'referrer_premium_expires_at',v_existing.referrer_access_expires_at,
      'referrer_reward_xp',0
    );
  end if;

  update public.profiles
     set xp=coalesce(xp,0)+v_reward
   where id=v_referrer
   returning xp into v_new_xp;
  if v_new_xp is null then raise exception 'Referrer profile not found'; end if;

  if to_regclass('public.league_members') is not null then
    execute 'update public.league_members
                set season_xp=greatest(0,coalesce(season_xp,0)+$1),updated_at=now()
              where user_id=$2'
      using v_reward,v_referrer;
  end if;

  return jsonb_build_object(
    'success',true,
    'already_claimed',false,
    'premium_expires_at',v_expires,
    'referrer_premium_expires_at',v_expires,
    'referrer_reward_xp',v_reward
  );
end
$$;

grant execute on function public.get_or_create_hub_referral_code() to authenticated;
grant execute on function public.get_hub_referral_dashboard() to authenticated;
grant execute on function public.claim_hub_referral(text) to authenticated;

create or replace function public.get_hub_coupon_access()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_exp timestamptz;
  v_code text:='';
  v_source text:='';
begin
  if v_uid is null then return jsonb_build_object('active',false); end if;

  select max(expires_at) into v_exp
  from (
    select r.access_expires_at as expires_at
      from public.hub_coupon_redemptions r
     where r.user_id=v_uid
    union all
    select r.access_expires_at
      from public.hub_referrals r
     where r.referred_user_id=v_uid
    union all
    select r.referrer_access_expires_at
      from public.hub_referrals r
     where r.referrer_id=v_uid
    union all
    select r.access_expires_at
      from public.league_rewards r
     where r.user_id=v_uid
  ) access_rows;

  if v_exp is null or v_exp<=now() then
    return jsonb_build_object('active',false);
  end if;

  select c.code into v_code
    from public.hub_coupon_redemptions r
    join public.hub_access_coupons c on c.id=r.coupon_id
   where r.user_id=v_uid and r.access_expires_at=v_exp
   limit 1;
  if v_code<>'' then
    v_source:='coupon';
  else
    select referral_code into v_code
      from public.hub_referrals
     where (referred_user_id=v_uid and access_expires_at=v_exp)
        or (referrer_id=v_uid and referrer_access_expires_at=v_exp)
     limit 1;
    if v_code is not null then
      v_source:='referral';
    else
      v_code:='LEAGUE-TOP3';
      v_source:='league_reward';
    end if;
  end if;

  return jsonb_build_object(
    'active',true,
    'code',coalesce(v_code,''),
    'source',v_source,
    'expires_at',v_exp
  );
end
$$;

grant execute on function public.get_hub_coupon_access() to authenticated;
