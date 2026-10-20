-- Applied to verified project thrkmilojkqqntdnrgwo via MCP on 2026-10-20 UTC.
-- Run as database owner. This creates only new application-owned objects.
begin;

-- Deliberately fail on existing objects rather than silently trust their grants.
create schema admin_private;
revoke all on schema admin_private from public, anon, authenticated;

create table admin_private.members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table admin_private.members enable row level security;
revoke all on table admin_private.members from public, anon, authenticated;
-- No client policies or direct grants: membership is owner-managed only.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'google'
    and coalesce(auth.jwt() -> 'amr', '[]'::jsonb) @> '[{"method":"oauth"}]'::jsonb
    and exists (
      select 1 from admin_private.members m where m.user_id = auth.uid()
    );
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'Current caller only; Google plus owner-granted admin membership. No self-promotion.';
commit;
