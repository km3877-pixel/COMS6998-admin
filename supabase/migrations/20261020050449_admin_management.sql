begin;

-- Private audit records retain ownership, original content, ratings and provenance.
-- No consumer grants or policies are changed.
create table admin_private.media_audit (
  id bigint generated always as identity primary key,
  image_id uuid not null, actor uuid not null, action text not null,
  snapshot jsonb not null, created_at timestamptz not null default now()
);
create index media_audit_image on admin_private.media_audit(image_id,created_at desc);
alter table admin_private.media_audit enable row level security;
revoke all on admin_private.media_audit from public,anon,authenticated;
create table admin_private.media_jobs (
  id uuid primary key, actor uuid not null, created_at timestamptz not null default now(),
  completed boolean not null default false
);
create index media_jobs_actor_time on admin_private.media_jobs(actor,created_at desc);
alter table admin_private.media_jobs enable row level security;
revoke all on admin_private.media_jobs from public,anon,authenticated;

create function public.admin_profiles(p_search text default '',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_search is null or length(p_search)>100 or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filter' using errcode='22023'; end if;
  with rows as (
    select p.id,p.firstname,p.lastname,u.email,u.created_at,u.last_sign_in_at,
      exists(select 1 from admin_private.members m where m.user_id=p.id) as admin,
      (select count(*) from public.caption_images i where i.uploaded_by=p.id) as posts,
      (select count(*) from public.caption_votes v where v.user_id=p.id) as votes
    from public.profiles p left join auth.users u on u.id=p.id
    where strpos(lower(concat_ws(' ',p.id::text,p.firstname,p.lastname,u.email)),lower(p_search))>0
  )
  select jsonb_build_object('total',(select count(*) from rows),'rows',coalesce(
    (select jsonb_agg(to_jsonb(r)) from (select * from rows order by created_at desc nulls last,id limit 20 offset (p_page-1)*20) r),'[]'::jsonb)) into result;
  return result;
end $$;

create function public.admin_media_list(p_search text default '',p_status text default 'all',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_search is null or length(p_search)>100 or p_status is null or p_status not in ('all','published','draft') or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filter' using errcode='22023'; end if;
  return (with rows as (
    select i.id,i.alt_text,i.published,i.ai_generated,i.created_at,i.uploaded_by,
      (select count(*) from public.captions c where c.image_id=i.id and c.active) as captions,
      (select count(*) from public.caption_votes v join public.captions c on c.id=v.caption_id where c.image_id=i.id) as votes
    from public.caption_images i
    where (p_status='all' or i.published=(p_status='published'))
      and (strpos(lower(i.alt_text||' '||i.id::text),lower(p_search))>0 or exists(
        select 1 from public.captions c where c.image_id=i.id and strpos(lower(c.text),lower(p_search))>0))
  ) select jsonb_build_object('total',(select count(*) from rows),'rows',coalesce(
    (select jsonb_agg(to_jsonb(r)) from (select * from rows order by created_at desc,id limit 20 offset (p_page-1)*20) r),'[]'::jsonb)));
end $$;

create function public.admin_media_detail(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return (select to_jsonb(i)||jsonb_build_object('captions',coalesce((
    select jsonb_agg(to_jsonb(c)||jsonb_build_object(
      'upvotes',(select count(*) from public.caption_votes v where v.caption_id=c.id and v.value=1),
      'downvotes',(select count(*) from public.caption_votes v where v.caption_id=c.id and v.value=-1))
      order by c.active desc,c.style,c.id) from public.captions c where c.image_id=i.id),'[]'::jsonb),
      'revision',(select count(*) from admin_private.media_audit a where a.image_id=i.id),
      'history',coalesce((select jsonb_agg(jsonb_build_object('action',a.action,'actor',a.actor,'created_at',a.created_at) order by a.id desc)
        from admin_private.media_audit a where a.image_id=i.id),'[]'::jsonb))
    from public.caption_images i where i.id=p_id);
end $$;

create function public.admin_ratings(p_search text default '',p_value text default 'all',p_mode text default 'current',p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_search is null or length(p_search)>100 or p_value is null or p_value not in ('all','up','down','removed')
    or p_mode is null or p_mode not in ('current','events','deleted') or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filter' using errcode='22023'; end if;
  return (with votes as (
    select v.user_id,v.caption_id,v.value,v.updated_at as rated_at,null::bigint as event_id from public.caption_votes v where p_mode='current'
    union all
    select v.user_id,v.caption_id,v.value,v.created_at,v.id from public.caption_vote_events v where p_mode='events'
  ), live as (
    select v.*,c.text as caption,c.style,c.active,i.id as image_id,i.alt_text,false as deleted
    from votes v join public.captions c on c.id=v.caption_id join public.caption_images i on i.id=c.image_id
  ), archived as (
    select (v->>'user_id')::uuid as user_id,(v->>'caption_id')::uuid as caption_id,(v->>'value')::smallint as value,
      (v->>'created_at')::timestamptz as rated_at,(v->>'id')::bigint as event_id,
      c->>'text' as caption,c->>'style' as style,false as active,a.image_id,a.snapshot->'image'->>'alt_text' as alt_text,true as deleted
    from admin_private.media_audit a cross join lateral jsonb_array_elements(a.snapshot->'events') v
    join lateral jsonb_array_elements(a.snapshot->'captions') c on c->>'id'=v->>'caption_id'
    where a.action='delete' and p_mode='deleted'
  ), rows as (
    select v.*,u.email,concat_ws(' ',p.firstname,p.lastname) as name from (select * from live union all select * from archived) v
    left join public.profiles p on p.id=v.user_id left join auth.users u on u.id=v.user_id
    where (p_value='all' or (p_value='up' and v.value=1) or (p_value='down' and v.value=-1) or (p_value='removed' and v.value is null))
      and strpos(lower(concat_ws(' ',v.caption,v.alt_text,v.user_id::text,v.image_id::text,u.email,p.firstname,p.lastname)),lower(p_search))>0
  ) select jsonb_build_object('total',(select count(*) from rows),'rows',coalesce(
    (select jsonb_agg(to_jsonb(r)) from (select * from rows order by rated_at desc,event_id desc nulls last,caption_id,user_id limit 20 offset (p_page-1)*20) r),'[]'::jsonb)));
end $$;

create function public.admin_reserve_media(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_id is null then raise exception 'Invalid request' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('admin-media-create',12));
  if exists(select 1 from admin_private.media_jobs where id=p_id) then raise exception 'Request already submitted' using errcode='22023'; end if;
  if (select count(*) from admin_private.media_jobs where created_at>now()-interval '24 hours')>=20
    or exists(select 1 from admin_private.media_jobs where actor=auth.uid() and created_at>now()-interval '30 seconds') then
    raise exception 'Please wait before creating more media' using errcode='P0001';
  end if;
  insert into admin_private.media_jobs(id,actor) values(p_id,auth.uid());
end $$;

create function public.admin_create_media(p_id uuid,p_alt text,p_source_hash text,p_hosted_hash text,p_bytes integer,p_captions jsonb,p_provenance jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare run uuid:=gen_random_uuid(); s text; job admin_private.media_jobs;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into job from admin_private.media_jobs where id=p_id and actor=auth.uid() for update;
  if not found then raise exception 'Reserve creation first' using errcode='42501'; end if;
  if job.completed then return p_id; end if;
  if p_alt is null or length(btrim(p_alt)) not between 1 and 300 or p_source_hash is null or p_source_hash !~ '^[0-9a-f]{64}$'
    or p_hosted_hash is null or p_hosted_hash !~ '^[0-9a-f]{64}$' or p_bytes is null or p_bytes not between 1 and 256000
    or p_captions is null or jsonb_typeof(p_captions)<>'object' or p_provenance is null or jsonb_typeof(p_provenance)<>'object' then
    raise exception 'Invalid media' using errcode='22023';
  end if;
  foreach s in array array['dry_self_deprecating','internet_voice','college_twist'] loop
    if jsonb_typeof(p_captions->s) is distinct from 'string' or length(btrim(p_captions->>s)) not between 1 and 500 then
      raise exception 'Three captions required' using errcode='22023';
    end if;
  end loop;
  insert into public.caption_images(id,storage_path,alt_text,source_sha256,hosted_sha256,hosted_bytes,provenance,uploaded_by)
    values(p_id,'admin/'||p_id::text||'.webp',btrim(p_alt),p_source_hash,p_hosted_hash,p_bytes,
      jsonb_build_object('source','admin_upload','created_by',auth.uid()),auth.uid());
  insert into public.caption_runs(id,image_id,provenance) values(run,p_id,p_provenance||jsonb_build_object('created_by',auth.uid()));
  foreach s in array array['dry_self_deprecating','internet_voice','college_twist'] loop
    insert into public.captions(id,image_id,run_id,text,style,active,provenance)
      values(gen_random_uuid(),p_id,run,btrim(p_captions->>s),s,true,p_provenance);
  end loop;
  update admin_private.media_jobs set completed=true where id=p_id;
  insert into admin_private.media_audit(image_id,actor,action,snapshot) values(p_id,auth.uid(),'create',jsonb_build_object('run_id',run));
  return p_id;
end $$;

create function public.admin_update_media(p_id uuid,p_revision bigint,p_alt text,p_published boolean,p_captions jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare img public.caption_images; entry jsonb; old public.captions; replacement uuid; seen uuid[]:='{}';
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into img from public.caption_images where id=p_id for update;
  if not found then raise exception 'Media not found' using errcode='P0002'; end if;
  if p_revision is distinct from (select count(*) from admin_private.media_audit where image_id=p_id) then raise exception 'Media changed; reload before saving' using errcode='40001'; end if;
  if p_alt is null or length(btrim(p_alt)) not between 1 and 300 or p_published is null
    or jsonb_typeof(p_captions) is distinct from 'array' or jsonb_array_length(p_captions)>3 then raise exception 'Invalid media' using errcode='22023'; end if;
  insert into admin_private.media_audit(image_id,actor,action,snapshot) values(p_id,auth.uid(),'update',
    jsonb_build_object('image',to_jsonb(img),'captions',(select jsonb_agg(to_jsonb(c)) from public.captions c where image_id=p_id)));
  for entry in select * from jsonb_array_elements(p_captions) loop
    select * into old from public.captions where id=(entry->>'id')::uuid and image_id=p_id and active
      and generated_by is null and authored_by is null for update;
    if not found or old.id=any(seen) or jsonb_typeof(entry->'text') is distinct from 'string' or length(btrim(entry->>'text')) not between 1 and 500 then
      raise exception 'Caption changed or invalid' using errcode='40001';
    end if;
    seen=array_append(seen,old.id);
    if old.text<>btrim(entry->>'text') then
      replacement=gen_random_uuid();
      update public.captions set active=false where id=old.id;
      insert into public.captions(id,image_id,run_id,text,style,active,provenance)
        values(replacement,p_id,old.run_id,btrim(entry->>'text'),old.style,true,
          jsonb_build_object('source','admin_edit','previous_caption_id',old.id,'edited_by',auth.uid(),'edited_at',now()));
    end if;
  end loop;
  if p_published and not exists(select 1 from public.captions where image_id=p_id and active) then raise exception 'A caption is required to publish' using errcode='22023'; end if;
  if p_published and img.uploaded_by is null and (select count(*) from public.captions where image_id=p_id and active and generated_by is null and authored_by is null)<>3 then
    raise exception 'Curated media needs three captions' using errcode='22023'; end if;
  update public.caption_images set alt_text=btrim(p_alt),published=p_published where id=p_id;
end $$;

create function public.admin_delete_media(p_id uuid,p_revision bigint,p_confirmation text) returns void
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare img public.caption_images; snapshot jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_confirmation is distinct from 'DELETE' then raise exception 'Type DELETE to confirm' using errcode='22023'; end if;
  -- A short exclusive-writer lock makes the archive and removal atomic with
  -- consumer voting/generation. Readers continue. Timeout asks the admin to retry.
  lock table public.caption_images,public.captions,public.caption_runs,
    public.review_exposures,public.caption_impressions,public.caption_votes,
    public.caption_vote_events,public.caption_generation_requests,public.image_generation_requests in share row exclusive mode;
  select * into img from public.caption_images where id=p_id;
  if not found then raise exception 'Media not found' using errcode='P0002'; end if;
  if p_revision is distinct from (select count(*) from admin_private.media_audit where image_id=p_id) then raise exception 'Media changed; reload before deleting' using errcode='40001'; end if;
  if exists(select 1 from public.caption_generation_requests where image_id=p_id and status='pending')
    or exists(select 1 from public.image_generation_requests where image_id=p_id and status='pending') then
    raise exception 'Generation is still pending; retry after it completes' using errcode='55000';
  end if;
  snapshot=jsonb_build_object('image',to_jsonb(img),
    'captions',coalesce((select jsonb_agg(to_jsonb(t)) from public.captions t where image_id=p_id),'[]'::jsonb),
    'runs',coalesce((select jsonb_agg(to_jsonb(t)) from public.caption_runs t where image_id=p_id),'[]'::jsonb),
    'exposures',coalesce((select jsonb_agg(to_jsonb(t)) from public.review_exposures t where image_id=p_id),'[]'::jsonb),
    'impressions',coalesce((select jsonb_agg(to_jsonb(t)) from public.caption_impressions t where caption_id in (select id from public.captions where image_id=p_id)),'[]'::jsonb),
    'votes',coalesce((select jsonb_agg(to_jsonb(t)) from public.caption_votes t where caption_id in (select id from public.captions where image_id=p_id)),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(t)) from public.caption_vote_events t where caption_id in (select id from public.captions where image_id=p_id)),'[]'::jsonb),
    'caption_requests',coalesce((select jsonb_agg(to_jsonb(t)) from public.caption_generation_requests t where image_id=p_id),'[]'::jsonb),
    'image_requests',coalesce((select jsonb_agg(to_jsonb(t)) from public.image_generation_requests t where image_id=p_id),'[]'::jsonb));
  insert into admin_private.media_audit(image_id,actor,action,snapshot) values(p_id,auth.uid(),'delete',snapshot);
  delete from public.caption_generation_requests where image_id=p_id;
  delete from public.image_generation_requests where image_id=p_id;
  delete from public.caption_votes where caption_id in (select id from public.captions where image_id=p_id);
  delete from public.caption_vote_events where caption_id in (select id from public.captions where image_id=p_id);
  delete from public.caption_impressions where caption_id in (select id from public.captions where image_id=p_id);
  delete from public.review_exposures where image_id=p_id;
  delete from public.captions where image_id=p_id;
  delete from public.caption_runs where image_id=p_id;
  delete from public.caption_images where id=p_id;
  -- The private Storage derivative stays as an audit artifact. With the image
  -- row gone it is inaccessible through consumer RLS and the admin media route.
end $$;

revoke all on function public.admin_profiles(text,integer),public.admin_media_list(text,text,integer),
  public.admin_media_detail(uuid),public.admin_ratings(text,text,text,integer),public.admin_reserve_media(uuid),
  public.admin_create_media(uuid,text,text,text,integer,jsonb,jsonb),public.admin_update_media(uuid,bigint,text,boolean,jsonb),
  public.admin_delete_media(uuid,bigint,text) from public,anon;
grant execute on function public.admin_profiles(text,integer),public.admin_media_list(text,text,integer),
  public.admin_media_detail(uuid),public.admin_ratings(text,text,text,integer),public.admin_reserve_media(uuid),
  public.admin_create_media(uuid,text,text,text,integer,jsonb,jsonb),public.admin_update_media(uuid,bigint,text,boolean,jsonb),
  public.admin_delete_media(uuid,bigint,text) to authenticated;
commit;
