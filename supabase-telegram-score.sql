create extension if not exists pgcrypto;
create table if not exists public.telegram_account_links(app_user_id uuid primary key references public.profiles(id) on delete cascade,telegram_user_id bigint unique,telegram_username text,telegram_name text,link_code text unique,code_expires_at timestamptz,linked_at timestamptz,updated_at timestamptz default now());
create table if not exists public.telegram_quiz_scores(telegram_user_id bigint primary key,app_user_id uuid unique references public.profiles(id) on delete set null,telegram_username text,telegram_name text,total_xp int not null default 0,pending_xp int not null default 0,correct_count int not null default 0,wrong_count int not null default 0,answer_count int not null default 0,last_chat_id bigint,last_topic text,last_answered_at timestamptz,updated_at timestamptz default now());
alter table public.telegram_account_links enable row level security;alter table public.telegram_quiz_scores enable row level security;
drop policy if exists tg_link_read on public.telegram_account_links;create policy tg_link_read on public.telegram_account_links for select to authenticated using(app_user_id=auth.uid());
drop policy if exists tg_score_read on public.telegram_quiz_scores;create policy tg_score_read on public.telegram_quiz_scores for select to authenticated using(app_user_id=auth.uid());
grant select on public.telegram_account_links,public.telegram_quiz_scores to authenticated;

create or replace function public.create_telegram_link_code() returns jsonb language plpgsql security definer set search_path=public as $$declare u uuid:=auth.uid();c text:=upper(encode(gen_random_bytes(6),'hex'));e timestamptz:=now()+interval '15 minutes';begin if u is null then raise exception 'Login required';end if;insert into telegram_account_links(app_user_id,link_code,code_expires_at)values(u,c,e)on conflict(app_user_id)do update set link_code=c,code_expires_at=e,updated_at=now();return jsonb_build_object('success',true,'code',c,'expires_at',e);end$$;

create or replace function public.confirm_telegram_link(p_code text,p_telegram_user_id bigint,p_username text default '',p_name text default 'Telegram User')returns jsonb language plpgsql security definer set search_path=public as $$declare u uuid;begin select app_user_id into u from telegram_account_links where link_code=upper(trim(p_code))and code_expires_at>now()for update;if u is null then return jsonb_build_object('success',false,'error','Code invalid or expired');end if;update telegram_account_links set telegram_user_id=null,linked_at=null where telegram_user_id=p_telegram_user_id and app_user_id<>u;update telegram_quiz_scores set app_user_id=null where app_user_id=u and telegram_user_id<>p_telegram_user_id;update telegram_account_links set telegram_user_id=p_telegram_user_id,telegram_username=p_username,telegram_name=p_name,link_code=null,code_expires_at=null,linked_at=now(),updated_at=now()where app_user_id=u;insert into telegram_quiz_scores(telegram_user_id,app_user_id,telegram_username,telegram_name)values(p_telegram_user_id,u,p_username,p_name)on conflict(telegram_user_id)do update set app_user_id=u,telegram_username=p_username,telegram_name=p_name,updated_at=now();return jsonb_build_object('success',true);end$$;

create or replace function public.record_telegram_quiz_answer(p_telegram_user_id bigint,p_chat_id bigint,p_username text,p_name text,p_is_correct boolean,p_topic text default 'Quiz')returns jsonb language plpgsql security definer set search_path=public as $$declare u uuid;d int:=case when p_is_correct then 20 else -10 end;begin select app_user_id into u from telegram_account_links where telegram_user_id=p_telegram_user_id and linked_at is not null;insert into telegram_quiz_scores(telegram_user_id,app_user_id,telegram_username,telegram_name,total_xp,pending_xp,correct_count,wrong_count,answer_count,last_chat_id,last_topic,last_answered_at)values(p_telegram_user_id,u,p_username,p_name,d,d,case when p_is_correct then 1 else 0 end,case when p_is_correct then 0 else 1 end,1,p_chat_id,p_topic,now())on conflict(telegram_user_id)do update set app_user_id=coalesce(telegram_quiz_scores.app_user_id,u),telegram_username=p_username,telegram_name=p_name,total_xp=telegram_quiz_scores.total_xp+d,pending_xp=telegram_quiz_scores.pending_xp+d,correct_count=telegram_quiz_scores.correct_count+case when p_is_correct then 1 else 0 end,wrong_count=telegram_quiz_scores.wrong_count+case when p_is_correct then 0 else 1 end,answer_count=telegram_quiz_scores.answer_count+1,last_chat_id=p_chat_id,last_topic=p_topic,last_answered_at=now(),updated_at=now();return jsonb_build_object('success',true,'xp_delta',d,'linked',u is not null);end$$;

create or replace function public.get_telegram_top15()
returns table(
  rank bigint,
  telegram_user_id bigint,
  app_user_id uuid,
  telegram_username text,
  telegram_name text,
  total_xp integer,
  correct_count integer,
  wrong_count integer,
  answer_count integer,
  accuracy integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path=public
as $$
  select
    row_number() over(order by s.total_xp desc,s.correct_count desc,s.answer_count desc,s.updated_at asc) as rank,
    s.telegram_user_id,s.app_user_id,s.telegram_username,s.telegram_name,
    s.total_xp,s.correct_count,s.wrong_count,s.answer_count,
    case when s.answer_count>0 then round((100.0*s.correct_count/s.answer_count)::numeric)::integer else 0 end as accuracy,
    s.updated_at
  from public.telegram_quiz_scores s
  where s.answer_count>0
  order by s.total_xp desc,s.correct_count desc,s.answer_count desc,s.updated_at asc
  limit 15;
$$;

create or replace function public.claim_telegram_quiz_xp()returns jsonb language plpgsql security definer set search_path=public as $$declare u uuid:=auth.uid();d int;t bigint;begin if u is null then raise exception 'Login required';end if;perform ensure_league_current();select telegram_user_id,pending_xp into t,d from telegram_quiz_scores where app_user_id=u for update;if t is null then return jsonb_build_object('success',true,'claimed_xp',0);end if;update profiles set xp=greatest(0,coalesce(xp,0)+d)where id=u;update league_members set season_xp=greatest(0,season_xp+d),updated_at=now()where user_id=u;update telegram_quiz_scores set pending_xp=0,updated_at=now()where telegram_user_id=t;return jsonb_build_object('success',true,'claimed_xp',d);end$$;

revoke all on function public.create_telegram_link_code() from public;revoke all on function public.confirm_telegram_link(text,bigint,text,text) from public;revoke all on function public.record_telegram_quiz_answer(bigint,bigint,text,text,boolean,text) from public;revoke all on function public.get_telegram_top15() from public;revoke all on function public.claim_telegram_quiz_xp() from public;grant execute on function public.create_telegram_link_code(),public.get_telegram_top15(),public.claim_telegram_quiz_xp() to authenticated;grant execute on function public.confirm_telegram_link(text,bigint,text,text),public.record_telegram_quiz_answer(bigint,bigint,text,text,boolean,text) to service_role;
