-- RATHOD HUB stale quiz cleanup
-- Run once in Supabase SQL Editor. Waiting rooms older than 24 hours are removed.
create or replace function public.cleanup_stale_quiz_rooms()
returns integer language plpgsql security definer set search_path=public as $$
declare v_codes text[];v_deleted integer:=0;
begin
  select coalesce(array_agg(room_code),array[]::text[]) into v_codes
  from public.quiz_battle_rooms where status='waiting' and created_at < now()-interval '24 hours';
  if cardinality(v_codes)=0 then return 0;end if;
  delete from public.quiz_battle_answers where room_code=any(v_codes);
  delete from public.quiz_battle_participants where room_code=any(v_codes);
  delete from public.quiz_battle_rooms where room_code=any(v_codes) and status='waiting' and created_at < now()-interval '24 hours';
  get diagnostics v_deleted=row_count;
  return v_deleted;
end $$;
revoke all on function public.cleanup_stale_quiz_rooms() from public;
grant execute on function public.cleanup_stale_quiz_rooms() to authenticated;
