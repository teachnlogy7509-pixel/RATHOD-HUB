-- RATHOD HUB common coupon/gift-card access
create extension if not exists pgcrypto;

create table if not exists public.hub_access_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  access_days integer not null default 5 check(access_days between 1 and 30),
  active boolean not null default true
);

create table if not exists public.hub_coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.hub_access_coupons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  access_expires_at timestamptz not null,
  unique(coupon_id,user_id)
);

alter table public.hub_access_coupons enable row level security;
alter table public.hub_coupon_redemptions enable row level security;

drop policy if exists hub_coupon_admin_read on public.hub_access_coupons;
create policy hub_coupon_admin_read on public.hub_access_coupons for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists hub_coupon_redemption_own_read on public.hub_coupon_redemptions;
create policy hub_coupon_redemption_own_read on public.hub_coupon_redemptions for select to authenticated using(user_id=auth.uid());

grant select on public.hub_access_coupons,public.hub_coupon_redemptions to authenticated;

create or replace function public.create_hub_coupon(p_code text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_code text;v_row public.hub_access_coupons;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Admin only';end if;
  v_code:=upper(trim(coalesce(nullif(p_code,''),'RATHOD-'||substr(replace(gen_random_uuid()::text,'-',''),1,10))));
  insert into public.hub_access_coupons(code,created_by,expires_at,access_days) values(v_code,auth.uid(),now()+interval '3 days',5) returning * into v_row;
  return jsonb_build_object('success',true,'code',v_row.code,'expires_at',v_row.expires_at,'access_days',v_row.access_days);
exception when unique_violation then raise exception 'This coupon code already exists';
end $$;

create or replace function public.redeem_hub_coupon(p_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_coupon public.hub_access_coupons;v_exp timestamptz;
begin
  if v_uid is null then raise exception 'Login required';end if;
  select * into v_coupon from public.hub_access_coupons where code=upper(trim(p_code)) and active=true and expires_at>now() for update;
  if not found then return jsonb_build_object('success',false,'error','Coupon invalid or expired');end if;
  select access_expires_at into v_exp from public.hub_coupon_redemptions where coupon_id=v_coupon.id and user_id=v_uid;
  if v_exp is not null then return jsonb_build_object('success',true,'code',v_coupon.code,'expires_at',v_exp,'already_redeemed',true);end if;
  v_exp:=now()+(v_coupon.access_days||' days')::interval;
  insert into public.hub_coupon_redemptions(coupon_id,user_id,access_expires_at) values(v_coupon.id,v_uid,v_exp);
  return jsonb_build_object('success',true,'code',v_coupon.code,'expires_at',v_exp,'already_redeemed',false);
end $$;

create or replace function public.get_hub_coupon_access()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_row record;
begin
  select r.access_expires_at,c.code into v_row from public.hub_coupon_redemptions r join public.hub_access_coupons c on c.id=r.coupon_id where r.user_id=auth.uid() and r.access_expires_at>now() order by r.access_expires_at desc limit 1;
  if not found then return jsonb_build_object('active',false);end if;
  return jsonb_build_object('active',true,'code',v_row.code,'expires_at',v_row.access_expires_at);
end $$;

grant execute on function public.create_hub_coupon(text),public.redeem_hub_coupon(text),public.get_hub_coupon_access() to authenticated;
