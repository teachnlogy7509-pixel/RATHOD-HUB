-- RATHOD HUB: expose only active coupon codes to authenticated users in My Vault.
-- Run once in Supabase SQL Editor after supabase-coupon-access.sql.

create or replace function public.get_active_hub_coupons()
returns table(code text, expires_at timestamptz, access_days integer)
language sql
security definer
set search_path = public
stable
as $$
  select c.code, c.expires_at, c.access_days
  from public.hub_access_coupons c
  where auth.uid() is not null
    and c.active = true
    and c.expires_at > now()
  order by c.created_at desc
  limit 20;
$$;

revoke all on function public.get_active_hub_coupons() from public;
grant execute on function public.get_active_hub_coupons() to authenticated;
