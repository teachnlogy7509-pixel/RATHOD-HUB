-- RATHOD HUB: atomic Community comments + live post updates
-- Apply once in the Supabase SQL editor. This keeps the existing posts.comments
-- JSONB data format while making concurrent comments append safely.

create or replace function public.add_community_post_comment(
  p_post_id bigint,
  p_text text default '',
  p_image_url text default null
)
returns public.posts
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_comment jsonb;
  v_row public.posts;
  v_text text := left(coalesce(p_text, ''), 1000);
  v_image_url text := nullif(trim(coalesce(p_image_url, '')), '');
begin
  if v_uid is null then
    raise exception 'Login required';
  end if;

  if nullif(btrim(v_text), '') is null and v_image_url is null then
    raise exception 'Write a comment or attach an image';
  end if;

  if v_image_url is not null and length(v_image_url) > 2000 then
    raise exception 'Image URL is too long';
  end if;

  select coalesce(nullif(trim(pr.name), ''), 'Member')
  into v_name
  from public.profiles pr
  where pr.id = v_uid;

  v_comment := jsonb_build_object(
    'author', coalesce(v_name, 'Member'),
    'text', v_text,
    'image_url', v_image_url,
    'user_id', v_uid,
    'date', now()
  );

  update public.posts p
  set comments =
    (case
       when jsonb_typeof(p.comments) = 'array' then p.comments
       else '[]'::jsonb
     end) || jsonb_build_array(v_comment)
  where p.id = p_post_id
    and coalesce(p.is_material, false) = false
  returning p.* into v_row;

  if not found then
    raise exception 'Community post not found';
  end if;

  return v_row;
end
$$;

revoke all on function public.add_community_post_comment(bigint, text, text) from public;
revoke all on function public.add_community_post_comment(bigint, text, text) from anon;
grant execute on function public.add_community_post_comment(bigint, text, text) to authenticated;

-- The existing Community frontend listens for INSERT / UPDATE / DELETE
-- events on public.posts. Ensure posts remains in the Realtime publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;
