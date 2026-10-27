begin;
-- Upload-only images are private drafts; no fabricated caption or model run.
create function public.admin_create_uploaded_image(p_id uuid,p_alt text,p_source_hash text,p_hosted_hash text,p_bytes integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare job admin_private.media_jobs;
begin
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select * into job from admin_private.media_jobs where id=p_id and actor=auth.uid() for update;
 if not found then raise exception 'Reserve upload first' using errcode='42501'; end if;
 if job.completed then return p_id; end if;
 if p_alt is null or length(btrim(p_alt)) not between 1 and 300 or p_source_hash is null or p_source_hash !~ '^[0-9a-f]{64}$'
 or p_hosted_hash is null or p_hosted_hash !~ '^[0-9a-f]{64}$' or p_bytes is null or p_bytes not between 1 and 256000 then
  raise exception 'Invalid image' using errcode='22023';
 end if;
 insert into public.caption_images(id,storage_path,alt_text,source_sha256,hosted_sha256,hosted_bytes,provenance,uploaded_by)
 values(p_id,'admin/'||p_id::text||'.webp',btrim(p_alt),p_source_hash,p_hosted_hash,p_bytes,
 jsonb_build_object('source','admin_upload','created_by',auth.uid()),auth.uid());
 update admin_private.media_jobs set completed=true,status='succeeded',completed_at=now(),details=jsonb_build_object('source','admin_upload','ai_generation',false) where id=p_id;
 insert into admin_private.media_audit(image_id,actor,action,snapshot) values(p_id,auth.uid(),'create',jsonb_build_object('source','admin_upload','ai_generation',false));
 return p_id;
end $$;
revoke all on function public.admin_create_uploaded_image(uuid,text,text,text,integer) from public,anon;
grant execute on function public.admin_create_uploaded_image(uuid,text,text,text,integer) to authenticated;
commit;
