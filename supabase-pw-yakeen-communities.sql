-- RATHOD HUB: PW Yakeen Hindi realtime communities
-- Run after supabase-study-batches.sql in Supabase SQL Editor.

do $$
declare
  v_admin_id uuid;
  v_admin_name text;
begin
  select id, coalesce(name,'RATHOD HUB Admin')
    into v_admin_id, v_admin_name
  from public.profiles
  where role='admin'
  limit 1;

  if v_admin_id is null then
    raise exception 'No admin profile found. First make one profile role=admin.';
  end if;

  insert into public.study_batches(name,subject,description,owner_id,owner_name,active,is_official)
  select 'Yakeen NEET Hindi 2027','Mixed NEET','Hindi medium NEET dropper batch • Target 2027',v_admin_id,v_admin_name,true,true
  where not exists (
    select 1 from public.study_batches where name='Yakeen NEET Hindi 2027' and active=true
  );

  insert into public.study_batches(name,subject,description,owner_id,owner_name,active,is_official)
  select 'Yakeen NEET Hindi 2.0 2027','Mixed NEET','Hindi medium Yakeen 2.0 • Target 2027',v_admin_id,v_admin_name,true,true
  where not exists (
    select 1 from public.study_batches where name='Yakeen NEET Hindi 2.0 2027' and active=true
  );
end $$;

-- Verify both communities
select id,name,active,is_official,owner_name,created_at
from public.study_batches
where name in ('Yakeen NEET Hindi 2027','Yakeen NEET Hindi 2.0 2027')
order by name;
