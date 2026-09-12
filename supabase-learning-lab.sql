-- RATHOD HUB Learning Lab: Mistake Vault + Knowledge Cards
-- Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.mistake_vault(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_key text not null,
  source text not null default 'Quiz',
  subject text not null default 'NEET',
  topic text,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index integer not null,
  selected_index integer,
  wrong_count integer not null default 1,
  review_count integer not null default 0,
  status text not null default 'active' check(status in ('active','recovered')),
  next_review_at timestamptz not null default (now()+interval '1 day'),
  last_wrong_at timestamptz not null default now(),
  recovered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id,question_key)
);
create index if not exists mistake_vault_review_idx on public.mistake_vault(user_id,status,next_review_at,wrong_count desc);
alter table public.mistake_vault enable row level security;
drop policy if exists mistake_vault_read_own on public.mistake_vault;
create policy mistake_vault_read_own on public.mistake_vault for select to authenticated using(user_id=auth.uid());
grant select on public.mistake_vault to authenticated;

create or replace function public.record_quiz_mistake(
  p_question_key text,p_source text,p_subject text,p_topic text,p_question text,p_options jsonb,p_correct_index integer,p_selected_index integer
) returns public.mistake_vault language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();v_row public.mistake_vault;
begin
  if v_uid is null then raise exception 'Login required';end if;
  insert into public.mistake_vault(user_id,question_key,source,subject,topic,question,options,correct_index,selected_index)
  values(v_uid,left(p_question_key,80),left(coalesce(p_source,'Quiz'),40),left(coalesce(p_subject,'NEET'),40),left(coalesce(p_topic,''),160),left(p_question,2000),coalesce(p_options,'[]'::jsonb),p_correct_index,p_selected_index)
  on conflict(user_id,question_key) do update set
    wrong_count=public.mistake_vault.wrong_count+1,selected_index=excluded.selected_index,last_wrong_at=now(),status='active',recovered_at=null,
    next_review_at=now()+case when public.mistake_vault.wrong_count>=3 then interval '1 day' else interval '3 days' end,
    source=excluded.source,subject=excluded.subject,topic=excluded.topic
  returning * into v_row;return v_row;
end $$;

create or replace function public.review_quiz_mistake(p_id uuid,p_recovered boolean default false)
returns public.mistake_vault language plpgsql security definer set search_path=public as $$
declare v_row public.mistake_vault;
begin
  update public.mistake_vault set review_count=review_count+1,
    status=case when p_recovered then 'recovered' else 'active' end,
    recovered_at=case when p_recovered then now() else null end,
    next_review_at=case when p_recovered then now()+interval '30 days' when review_count>=2 then now()+interval '7 days' else now()+interval '3 days' end
  where id=p_id and user_id=auth.uid() returning * into v_row;
  if v_row.id is null then raise exception 'Mistake not found';end if;return v_row;
end $$;

revoke all on function public.record_quiz_mistake(text,text,text,text,text,jsonb,integer,integer) from public;
revoke all on function public.review_quiz_mistake(uuid,boolean) from public;
grant execute on function public.record_quiz_mistake(text,text,text,text,text,jsonb,integer,integer) to authenticated;
grant execute on function public.review_quiz_mistake(uuid,boolean) to authenticated;
