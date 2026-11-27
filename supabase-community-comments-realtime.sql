-- RATHOD HUB Community comments: current deployed bigint(post_id) implementation.
-- Safe to re-run. Uses atomic JSONB updates to avoid concurrent-comment overwrites.
begin;

CREATE OR REPLACE FUNCTION public.add_community_post_comment(p_post_id bigint, p_text text DEFAULT ''::text, p_image_url text DEFAULT NULL::text)
 RETURNS posts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_uid uuid:=auth.uid();v_name text;v_comment jsonb;v_row public.posts;
 v_text text:=left(coalesce(p_text,''),1000);v_image text:=nullif(trim(coalesce(p_image_url,'')),'');
begin
 if v_uid is null then raise exception 'Login required'; end if;
 if nullif(btrim(v_text),'') is null and v_image is null then raise exception 'Write a comment or attach an image'; end if;
 if v_image is not null and length(v_image)>2000 then raise exception 'Image URL is too long'; end if;
 select coalesce(nullif(trim(pr.name),''),'Member') into v_name from public.profiles pr where pr.id=v_uid;
 v_comment:=jsonb_build_object('comment_id',gen_random_uuid()::text,'author',coalesce(v_name,'Member'),
  'text',v_text,'image_url',v_image,'user_id',v_uid,'date',now(),'likes','[]'::jsonb,'replies','[]'::jsonb);
 update public.posts p set comments=(case when jsonb_typeof(p.comments)='array' then p.comments else '[]'::jsonb end)||jsonb_build_array(v_comment)
 where p.id=p_post_id and coalesce(p.is_material,false)=false returning p.* into v_row;
 if not found then raise exception 'Community post not found'; end if;
 return v_row;
end $function$;

CREATE OR REPLACE FUNCTION public.delete_community_post_comment(p_post_id bigint, p_comment_id text)
 RETURNS posts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_uid uuid:=auth.uid();v_admin boolean:=false;v_row public.posts;
 v_comments jsonb;v_out jsonb:='[]'::jsonb;v_item jsonb;v_reply jsonb;
 v_replies jsonb;v_new_replies jsonb;v_found boolean:=false;
begin
 if v_uid is null then raise exception 'Login required'; end if;
 select coalesce((select role='admin' from public.profiles where id=v_uid),false) into v_admin;
 select * into v_row from public.posts where id=p_post_id and coalesce(is_material,false)=false for update;
 if not found then raise exception 'Community post not found'; end if;
 v_comments:=case when jsonb_typeof(v_row.comments)='array' then v_row.comments else '[]'::jsonb end;
 for v_item in select value from jsonb_array_elements(v_comments) loop
  if v_item->>'comment_id'=p_comment_id then
   if v_item->>'user_id'<>v_uid::text and not v_admin then raise exception 'You can delete only your own comment'; end if;
   v_found:=true;continue;
  end if;
  v_replies:=case when jsonb_typeof(v_item->'replies')='array' then v_item->'replies' else '[]'::jsonb end;
  v_new_replies:='[]'::jsonb;
  for v_reply in select value from jsonb_array_elements(v_replies) loop
   if v_reply->>'comment_id'=p_comment_id then
    if v_reply->>'user_id'<>v_uid::text and not v_admin then raise exception 'You can delete only your own reply'; end if;
    v_found:=true;continue;
   end if;
   v_new_replies:=v_new_replies||jsonb_build_array(v_reply);
  end loop;
  if jsonb_array_length(v_replies)<>jsonb_array_length(v_new_replies) then v_item:=jsonb_set(v_item,'{replies}',v_new_replies,true); end if;
  v_out:=v_out||jsonb_build_array(v_item);
 end loop;
 if not v_found then raise exception 'Comment not found'; end if;
 update public.posts set comments=v_out where id=p_post_id returning * into v_row;
 return v_row;
end $function$;

CREATE OR REPLACE FUNCTION public.edit_community_post_comment(p_post_id bigint, p_comment_id text, p_text text)
 RETURNS posts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_uid uuid:=auth.uid();v_admin boolean:=false;v_row public.posts;
 v_comments jsonb;v_out jsonb:='[]'::jsonb;v_item jsonb;v_reply jsonb;
 v_replies jsonb;v_new_replies jsonb;v_found boolean:=false;v_reply_found boolean;
 v_text text:=left(coalesce(p_text,''),1000);
begin
 if v_uid is null then raise exception 'Login required'; end if;
 if nullif(btrim(v_text),'') is null then raise exception 'Comment cannot be empty'; end if;
 select coalesce((select role='admin' from public.profiles where id=v_uid),false) into v_admin;
 select * into v_row from public.posts where id=p_post_id and coalesce(is_material,false)=false for update;
 if not found then raise exception 'Community post not found'; end if;
 v_comments:=case when jsonb_typeof(v_row.comments)='array' then v_row.comments else '[]'::jsonb end;
 for v_item in select value from jsonb_array_elements(v_comments) loop
  if v_item->>'comment_id'=p_comment_id then
   if v_item->>'user_id'<>v_uid::text and not v_admin then raise exception 'You can edit only your own comment'; end if;
   v_item:=v_item||jsonb_build_object('text',v_text,'edited_at',now());v_found:=true;
  else
   v_reply_found:=false;
   v_replies:=case when jsonb_typeof(v_item->'replies')='array' then v_item->'replies' else '[]'::jsonb end;
   v_new_replies:='[]'::jsonb;
   for v_reply in select value from jsonb_array_elements(v_replies) loop
    if v_reply->>'comment_id'=p_comment_id then
     if v_reply->>'user_id'<>v_uid::text and not v_admin then raise exception 'You can edit only your own reply'; end if;
     v_reply:=v_reply||jsonb_build_object('text',v_text,'edited_at',now());
     v_reply_found:=true;v_found:=true;
    end if;
    v_new_replies:=v_new_replies||jsonb_build_array(v_reply);
   end loop;
   if v_reply_found then v_item:=jsonb_set(v_item,'{replies}',v_new_replies,true); end if;
  end if;
  v_out:=v_out||jsonb_build_array(v_item);
 end loop;
 if not v_found then raise exception 'Comment not found'; end if;
 update public.posts set comments=v_out where id=p_post_id returning * into v_row;
 return v_row;
end $function$;

CREATE OR REPLACE FUNCTION public.reply_community_post_comment(p_post_id bigint, p_parent_comment_id text, p_text text DEFAULT ''::text, p_image_url text DEFAULT NULL::text)
 RETURNS posts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_uid uuid:=auth.uid();v_name text;v_reply jsonb;v_row public.posts;
 v_text text:=left(coalesce(p_text,''),1000);v_image text:=nullif(trim(coalesce(p_image_url,'')),'');
begin
 if v_uid is null then raise exception 'Login required'; end if;
 if nullif(btrim(coalesce(p_parent_comment_id,'')),'') is null then raise exception 'Choose a comment to reply to'; end if;
 if nullif(btrim(v_text),'') is null and v_image is null then raise exception 'Write a reply or attach an image'; end if;
 if v_image is not null and length(v_image)>2000 then raise exception 'Image URL is too long'; end if;
 select coalesce(nullif(trim(pr.name),''),'Member') into v_name from public.profiles pr where pr.id=v_uid;
 v_reply:=jsonb_build_object('comment_id',gen_random_uuid()::text,'author',coalesce(v_name,'Member'),
  'text',v_text,'image_url',v_image,'user_id',v_uid,'date',now(),'likes','[]'::jsonb);
 update public.posts p set comments=(
  select jsonb_agg(case when c.value->>'comment_id'=p_parent_comment_id then
    jsonb_set(c.value,'{replies}',(case when jsonb_typeof(c.value->'replies')='array' then c.value->'replies' else '[]'::jsonb end)||jsonb_build_array(v_reply),true)
    else c.value end order by c.ordinality)
  from jsonb_array_elements(case when jsonb_typeof(p.comments)='array' then p.comments else '[]'::jsonb end) with ordinality c(value,ordinality)
 )
 where p.id=p_post_id and coalesce(p.is_material,false)=false
 and exists(select 1 from jsonb_array_elements(case when jsonb_typeof(p.comments)='array' then p.comments else '[]'::jsonb end) x where x->>'comment_id'=p_parent_comment_id)
 returning p.* into v_row;
 if not found then raise exception 'Comment not found'; end if;
 return v_row;
end $function$;

CREATE OR REPLACE FUNCTION public.toggle_community_comment_like(p_post_id bigint, p_comment_id text)
 RETURNS posts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_uid uuid:=auth.uid();v_row public.posts;v_comments jsonb;v_out jsonb:='[]'::jsonb;
 v_item jsonb;v_reply jsonb;v_replies jsonb;v_new_replies jsonb;v_likes jsonb;
 v_found boolean:=false;v_reply_found boolean;
begin
 if v_uid is null then raise exception 'Login required'; end if;
 select * into v_row from public.posts where id=p_post_id and coalesce(is_material,false)=false for update;
 if not found then raise exception 'Community post not found'; end if;
 v_comments:=case when jsonb_typeof(v_row.comments)='array' then v_row.comments else '[]'::jsonb end;
 for v_item in select value from jsonb_array_elements(v_comments) loop
  if v_item->>'comment_id'=p_comment_id then
   v_likes:=case when jsonb_typeof(v_item->'likes')='array' then v_item->'likes' else '[]'::jsonb end;
   if exists(select 1 from jsonb_array_elements_text(v_likes) x where x=v_uid::text) then
    v_likes:=(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from jsonb_array_elements_text(v_likes) x where x<>v_uid::text);
   else v_likes:=v_likes||jsonb_build_array(v_uid::text); end if;
   v_item:=jsonb_set(v_item,'{likes}',v_likes,true);v_found:=true;
  else
   v_reply_found:=false;
   v_replies:=case when jsonb_typeof(v_item->'replies')='array' then v_item->'replies' else '[]'::jsonb end;
   v_new_replies:='[]'::jsonb;
   for v_reply in select value from jsonb_array_elements(v_replies) loop
    if v_reply->>'comment_id'=p_comment_id then
     v_likes:=case when jsonb_typeof(v_reply->'likes')='array' then v_reply->'likes' else '[]'::jsonb end;
     if exists(select 1 from jsonb_array_elements_text(v_likes) x where x=v_uid::text) then
      v_likes:=(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from jsonb_array_elements_text(v_likes) x where x<>v_uid::text);
     else v_likes:=v_likes||jsonb_build_array(v_uid::text);end if;
     v_reply:=jsonb_set(v_reply,'{likes}',v_likes,true);v_reply_found:=true;v_found:=true;
    end if;
    v_new_replies:=v_new_replies||jsonb_build_array(v_reply);
   end loop;
   if v_reply_found then v_item:=jsonb_set(v_item,'{replies}',v_new_replies,true);end if;
  end if;
  v_out:=v_out||jsonb_build_array(v_item);
 end loop;
 if not v_found then raise exception 'Comment not found'; end if;
 update public.posts set comments=v_out where id=p_post_id returning * into v_row;
 return v_row;
end $function$;

revoke all on function public.add_community_post_comment(bigint,text,text) from public, anon;
revoke all on function public.reply_community_post_comment(bigint,text,text,text) from public, anon;
revoke all on function public.edit_community_post_comment(bigint,text,text) from public, anon;
revoke all on function public.delete_community_post_comment(bigint,text) from public, anon;
revoke all on function public.toggle_community_comment_like(bigint,text) from public, anon;
grant execute on function public.add_community_post_comment(bigint,text,text) to authenticated;
grant execute on function public.reply_community_post_comment(bigint,text,text,text) to authenticated;
grant execute on function public.edit_community_post_comment(bigint,text,text) to authenticated;
grant execute on function public.delete_community_post_comment(bigint,text) to authenticated;
grant execute on function public.toggle_community_comment_like(bigint,text) to authenticated;

do $$
begin
 if not exists (
  select 1 from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='posts'
 ) then
  alter publication supabase_realtime add table public.posts;
 end if;
end
$$;

commit;
