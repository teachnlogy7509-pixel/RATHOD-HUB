-- Run this migration in Supabase SQL Editor after supabase-telegram-score.sql.
-- Normal quiz keeps +20/-10. The bot can pass mode-specific scores:
-- PYQ +50/-20 and high-level +100/-50.

create or replace function public.record_telegram_quiz_answer(
  p_telegram_user_id bigint,
  p_chat_id bigint,
  p_username text,
  p_name text,
  p_is_correct boolean,
  p_topic text default 'Quiz',
  p_correct_score integer default 20,
  p_wrong_score integer default -10
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  u uuid;
  d integer := case
    when p_is_correct then coalesce(p_correct_score, 20)
    else coalesce(p_wrong_score, -10)
  end;
begin
  select app_user_id into u
  from telegram_account_links
  where telegram_user_id=p_telegram_user_id
    and linked_at is not null;

  insert into telegram_quiz_scores(
    telegram_user_id, app_user_id, telegram_username, telegram_name,
    total_xp, pending_xp, correct_count, wrong_count, answer_count,
    last_chat_id, last_topic, last_answered_at
  ) values (
    p_telegram_user_id, u, p_username, p_name,
    d, d,
    case when p_is_correct then 1 else 0 end,
    case when p_is_correct then 0 else 1 end,
    1, p_chat_id, p_topic, now()
  )
  on conflict(telegram_user_id) do update set
    app_user_id=coalesce(telegram_quiz_scores.app_user_id,u),
    telegram_username=p_username,
    telegram_name=p_name,
    total_xp=telegram_quiz_scores.total_xp+d,
    pending_xp=telegram_quiz_scores.pending_xp+d,
    correct_count=telegram_quiz_scores.correct_count+case when p_is_correct then 1 else 0 end,
    wrong_count=telegram_quiz_scores.wrong_count+case when p_is_correct then 0 else 1 end,
    answer_count=telegram_quiz_scores.answer_count+1,
    last_chat_id=p_chat_id,
    last_topic=p_topic,
    last_answered_at=now(),
    updated_at=now();

  return jsonb_build_object(
    'success', true,
    'xp_delta', d,
    'linked', u is not null,
    'mode', case
      when p_correct_score=50 and p_wrong_score=-20 then 'pyq'
      when p_correct_score=100 and p_wrong_score=-50 then 'highlevel'
      else 'quiz'
    end
  );
end
$$;

revoke all on function public.record_telegram_quiz_answer(bigint,bigint,text,text,boolean,text,integer,integer) from public;
grant execute on function public.record_telegram_quiz_answer(bigint,bigint,text,text,boolean,text,integer,integer) to service_role;
