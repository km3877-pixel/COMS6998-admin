begin;

-- Add a human caption and save the image atomically, using the existing update
-- guard, revision/audit mechanism and publication rules. No consumer RLS changes.
create function public.admin_save_media_with_caption(
  p_id uuid,p_revision bigint,p_alt text,p_published boolean,p_captions jsonb,p_text text
) returns void
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare img public.caption_images; run_id uuid:=gen_random_uuid(); caption_id uuid:=gen_random_uuid(); metadata jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_text is null or length(btrim(p_text)) not between 1 and 500 then
    raise exception 'Enter a caption (1-500 characters)' using errcode='22023';
  end if;
  select * into img from public.caption_images where id=p_id for update;
  if not found then raise exception 'Media not found' using errcode='P0002'; end if;
  if p_revision is distinct from (select count(*) from admin_private.media_audit where image_id=p_id) then
    raise exception 'Media changed; reload before saving' using errcode='40001';
  end if;
  if exists(select 1 from public.captions where image_id=p_id and authored_by=auth.uid()) then
    raise exception 'You already have a written caption on this image' using errcode='23505';
  end if;
  metadata=jsonb_build_object('kind','human','source','admin_written','created_by',auth.uid());
  insert into public.caption_runs(id,image_id,provenance) values(run_id,p_id,metadata);
  insert into public.captions(id,image_id,run_id,text,style,active,authored_by,provenance)
    values(caption_id,p_id,run_id,btrim(p_text),'human',true,auth.uid(),metadata);
  perform public.admin_update_media(p_id,p_revision,p_alt,p_published,p_captions);
  -- The update audit snapshot includes the inserted caption and its authorship.
end $$;
revoke all on function public.admin_save_media_with_caption(uuid,bigint,text,boolean,jsonb,text) from public,anon,authenticated;
grant execute on function public.admin_save_media_with_caption(uuid,bigint,text,boolean,jsonb,text) to authenticated;
commit;
