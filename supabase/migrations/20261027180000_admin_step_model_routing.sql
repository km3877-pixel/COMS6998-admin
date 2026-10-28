-- Allow only model reassignment on existing prompt steps; preserve all existing grants and audit checks.
create or replace function public.admin_config_write(p_resource text,p_operation text,p_id uuid,p_revision integer,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare tab text; cols text[]; col_sql text; assignments text; old_row jsonb; new_row jsonb;
begin
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 tab=admin_private.config_table(p_resource);
 cols=case p_resource when 'providers' then array['name','slug'] when 'models' then array['provider_id','name','model_id']
 when 'terms' then array['term','definition','example'] when 'examples' then array['image_description','caption','explanation']
 when 'domains' then array['domain'] when 'emails' then array['email'] when 'mix' then array['caption_count'] when 'steps' then array['model_id'] end;
 if tab is null or cols is null or p_operation is null or p_operation not in ('create','update','delete') or p_id is null
 or (p_resource in ('mix','steps') and p_operation<>'update') then raise exception 'Invalid operation' using errcode='22023'; end if;
 -- Serializes reference checks and mix validation, without locking consumer tables.
 perform pg_advisory_xact_lock(hashtextextended('admin-configuration',7));
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 execute format('select to_jsonb(t) from admin_private.%I t where id=$1 for update',tab) into old_row using p_id;
 if p_operation<>'create' and old_row is null then raise exception 'Record not found' using errcode='P0002'; end if;
 if p_operation<>'create' and p_revision is distinct from (old_row->>'revision')::integer then raise exception 'Record changed' using errcode='40001'; end if;
 if p_operation='delete' then
  execute format('delete from admin_private.%I where id=$1',tab) using p_id;
 else
  if p_data is null or jsonb_typeof(p_data)<>'object' or exists(select 1 from jsonb_object_keys(p_data) k where not k=any(cols))
    or exists(select 1 from unnest(cols) c where not p_data ? c) then raise exception 'Invalid fields' using errcode='22023'; end if;
  select string_agg(format('%I',c),','),string_agg(format('%I=r.%I',c,c),',') into col_sql,assignments from unnest(cols) c;
  if p_operation='create' then
   execute format('insert into admin_private.%I(id,%s) select $1,%s from jsonb_populate_record(null::admin_private.%I,$2) returning to_jsonb(%I.*)',tab,col_sql,col_sql,tab,tab) into new_row using p_id,p_data;
  else
   execute format('update admin_private.%I t set %s,revision=t.revision+1 from jsonb_populate_record(null::admin_private.%I,$2) r where t.id=$1 returning to_jsonb(t)',tab,assignments,tab) into new_row using p_id,p_data;
  end if;
  if p_resource='mix' and not exists(select 1 from admin_private.prompt_mix where caption_count>0) then raise exception 'Keep at least one chain enabled' using errcode='23514'; end if;
 end if;
 insert into admin_private.configuration_audit(resource,record_id,actor,operation,before_record,after_record)
 values(p_resource,p_id,auth.uid(),p_operation,old_row,new_row);
 return p_id;
end $$;

