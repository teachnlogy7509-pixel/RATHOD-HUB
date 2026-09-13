-- RATHOD HUB: 12-day NEET 720 Pro gift card for season Top 3
-- Run once in Supabase SQL Editor after supabase-league.sql.

alter table public.league_rewards
  add column if not exists gift_card_code text,
  add column if not exists gift_card_issued_at timestamptz,
  add column if not exists pro_test_access_expires_at timestamptz;

create unique index if not exists league_rewards_gift_card_code_uidx
  on public.league_rewards(gift_card_code)
  where gift_card_code is not null;

create or replace function public.issue_neet720_pro_gift_card()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.gift_card_code is null then
    new.gift_card_code := 'N720-PRO-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  end if;

  if new.gift_card_issued_at is null then
    new.gift_card_issued_at := now();
  end if;

  if new.pro_test_access_expires_at is null then
    new.pro_test_access_expires_at := now() + interval '12 days';
  end if;

  return new;
end;
$$;

drop trigger if exists league_rewards_issue_neet720_card
  on public.league_rewards;

create trigger league_rewards_issue_neet720_card
before insert on public.league_rewards
for each row
execute function public.issue_neet720_pro_gift_card();

-- Give the card to already-issued active Top-3 rewards as well.
update public.league_rewards
set gift_card_code = coalesce(
      gift_card_code,
      'N720-PRO-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))
    ),
    gift_card_issued_at = coalesce(gift_card_issued_at, now()),
    pro_test_access_expires_at = coalesce(
      pro_test_access_expires_at,
      now() + interval '12 days'
    )
where final_rank between 1 and 3
  and gift_card_code is null;

-- Users can read their own reward card; existing broad reward-read policy remains intact.
grant select on public.league_rewards to authenticated;
