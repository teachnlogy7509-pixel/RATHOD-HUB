-- RATHOD HUB: secure admin bonus XP from Telegram
-- Run once in Supabase SQL Editor.
-- The bot calls this through the service_role key; no public RPC access is granted.

create table if not exists public.telegram_bonus_admins (
  telegram_user_id bigint primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Existing bot admin. Add future admins here only after updating the bot allowlist.
insert into public.telegram_bonus_admins(telegram_user_id, active)
values (8043570403, true)
on conflict (telegram_user_id) do update set active=true;

create table if not exists public.telegram_bonus_xp_log (
  id bigint generated always as identity primary key,
  admin_telegram_user_id bigint not null,
  target_input text not null,
  target_app_user_id uuid references public.profiles(id) on delete set null,
  target_telegram_user_id bigint,
  amount integer not null check (amount between 1 and 10000),
  reason text not null check (char_length(reason) between 3 and 300),
  created_at timestamptz not null default now()
);

alter table public.telegram_bonus_admins enable row level security;
alter table public.telegram_bonus_xp_log enable row level security;

create or replace function public.admin_grant_bonus_xp(
  p_target text,
  p_amount integer,
  p_reason text,
  p_admin_telegram_user_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_target text := trim(coalesce(p_target, ''));
  v_reason text := trim(coalesce(p_reason, ''));
  v_user_id uuid;
  v_telegram_user_id bigint;
  v_old_xp integer;
  v_new_xp integer;
begin
  if not exists (
    select 1 from public.telegram_bonus_admins
    where telegram_user_id=p_admin_telegram_user_id and active=true
  ) then
    raise exception 'Telegram admin is not allowed';
  end if;

  if v_target='' then raise exception 'Target is required'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 10000 then
    raise exception 'Bonus XP must be between 1 and 10000';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 300 then
    raise exception 'Reason must be between 3 and 300 characters';
  end if;

  -- A numeric target is a Telegram user ID. Otherwise match the Supabase email.
  if v_target ~ '^[0-9]+$' then
    select app_user_id, telegram_user_id
      into v_user_id, v_telegram_user_id
      from public.telegram_account_links
     where telegram_user_id=v_target::bigint and linked_at is not null;
  else
    select id into v_user_id
      from auth.users
     where lower(email)=lower(v_target)
     limit 1;
    if v_user_id is not null then
      select telegram_user_id into v_telegram_user_id
        from public.telegram_account_links
       where app_user_id=v_user_id and linked_at is not null;
    end if;
  end if;

  if v_user_id is null then
    return jsonb_build_object('success',false,'error','User not found. Use the exact app email or linked Telegram user ID.');
  end if;

  select coalesce(xp,0)::integer into v_old_xp
    from public.profiles where id=v_user_id for update;
  if v_old_xp is null then
    return jsonb_build_object('success',false,'error','Profile not found.');
  end if;
  v_new_xp := v_old_xp + p_amount;

  update public.profiles
     set xp=v_new_xp
   where id=v_user_id;

  -- Keep the season leaderboard consistent when the table is installed.
  update public.league_members
     set season_xp=greatest(0, coalesce(season_xp,0)+p_amount), updated_at=now()
   where user_id=v_user_id;

  -- Do not touch pending_xp: the user must not receive the same bonus twice on claim.
  if v_telegram_user_id is not null then
    update public.telegram_quiz_scores
       set total_xp=coalesce(total_xp,0)+p_amount, updated_at=now()
     where telegram_user_id=v_telegram_user_id;
  end if;

  insert into public.telegram_bonus_xp_log(
    admin_telegram_user_id,target_input,target_app_user_id,
    target_telegram_user_id,amount,reason
  ) values (
    p_admin_telegram_user_id,v_target,v_user_id,
    v_telegram_user_id,p_amount,v_reason
  );

  return jsonb_build_object(
    'success',true,
    'amount',p_amount,
    'old_xp',v_old_xp,
    'new_xp',v_new_xp,
    'app_user_id',v_user_id,
    'telegram_user_id',v_telegram_user_id,
    'reason',v_reason
  );
end
$$;

revoke all on function public.admin_grant_bonus_xp(text,integer,text,bigint) from public;
revoke all on function public.admin_grant_bonus_xp(text,integer,text,bigint) from authenticated;
grant execute on function public.admin_grant_bonus_xp(text,integer,text,bigint) to service_role;
