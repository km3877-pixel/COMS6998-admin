begin;

create table admin_private.membership_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  target_id uuid not null,
  action text not null check (action in ('grant', 'revoke')),
  changed_at timestamptz not null default now()
);
alter table admin_private.membership_audit enable row level security;
revoke all on admin_private.membership_audit from public, anon, authenticated;

create function public.admin_superusers()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', m.user_id, 'email', u.email,
      'name', concat_ws(' ', p.firstname, p.lastname),
      'granted_at', m.granted_at
    ) order by m.granted_at, m.user_id), '[]'::jsonb)
    from admin_private.members m
    join auth.users u on u.id = m.user_id
    join public.profiles p on p.id = m.user_id
  );
end;
$$;

create function public.admin_set_superuser(p_email text, p_enabled boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  matches integer;
  changed integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_enabled is null or p_email is null or length(trim(p_email)) not between 3 and 254 then
    raise exception 'Invalid input' using errcode = '22023';
  end if;
  -- Serialize all membership writes, including concurrent revocations.
  -- Recheck the actor after waiting: a different admin may have revoked them.
  lock table admin_private.members in exclusive mode;
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select count(*) into matches from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email));
  if matches <> 1 then
    raise exception 'Existing account required' using errcode = 'P0002';
  end if;
  select u.id into target from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email));

  if p_enabled then
    if not exists (select 1 from auth.users u where u.id = target and u.email_confirmed_at is not null)
       or not exists (select 1 from auth.identities i where i.user_id = target and i.provider = 'google') then
      raise exception 'Confirmed Google account required' using errcode = '22023';
    end if;
    insert into admin_private.members(user_id) values (target) on conflict do nothing;
  else
    if exists (select 1 from admin_private.members where user_id = target)
       and (select count(*) from admin_private.members) <= 1 then
      raise exception 'Cannot revoke the last superuser' using errcode = '23514';
    end if;
    delete from admin_private.members where user_id = target;
  end if;
  get diagnostics changed = row_count;
  if changed > 0 then
    insert into admin_private.membership_audit(actor_id, target_id, action)
    values (auth.uid(), target, case when p_enabled then 'grant' else 'revoke' end);
  end if;
  return target;
end;
$$;

revoke all on function public.admin_superusers() from public, anon, authenticated;
revoke all on function public.admin_set_superuser(text, boolean) from public, anon, authenticated;
grant execute on function public.admin_superusers() to authenticated;
grant execute on function public.admin_set_superuser(text, boolean) to authenticated;
comment on function public.admin_set_superuser(text, boolean) is
  'Google-authenticated current admins only; serialized changes, last-admin protection, private audit.';
commit;
