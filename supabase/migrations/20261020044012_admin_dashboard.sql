-- Aggregate-only admin API. No consumer table grants or policies are changed.
-- Applied to thrkmilojkqqntdnrgwo; filename matches hosted migration history.
begin;
create function public.admin_dashboard(p_days integer default 30, p_page integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'UTC')::date;
  first_day date;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_days is null or p_days not in (0,7,30) or p_page is null or p_page < 1 or p_page > 100000 then
    raise exception 'Invalid dashboard filter' using errcode = '22023';
  end if;
  if p_days = 0 then
    select least(today, coalesce(min(day),today)) into first_day from (
      select (created_at at time zone 'UTC')::date as day from public.caption_images
      union all select (created_at at time zone 'UTC')::date from public.caption_vote_events
    ) dates;
  else
    first_day := today - (p_days - 1);
  end if;

  with
  styles(style,label,position) as (values
    ('dry_self_deprecating','Dry / self-deprecating',1),
    ('internet_voice','Internet voice',2),
    ('college_twist','College twist',3)
  ),
  caption_scores as (
    select c.id,c.image_id,c.text,c.style,c.active,
      count(v.caption_id) as votes,
      count(*) filter(where v.value=1) as upvotes,
      count(*) filter(where v.value=-1) as downvotes
    from public.captions c left join public.caption_votes v on v.caption_id=c.id
    group by c.id,c.image_id,c.text,c.style,c.active
  ),
  image_scores as (
    select i.id,i.alt_text,i.published,i.created_at,
      coalesce(sum(c.upvotes),0) as upvotes,coalesce(sum(c.downvotes),0) as downvotes
    from public.caption_images i left join caption_scores c on c.image_id=i.id
    group by i.id,i.alt_text,i.published,i.created_at
  ),
  ranked_images as (
    select i.*,best.text as caption
    from image_scores i
    left join lateral (
      select text from caption_scores c where c.image_id=i.id
      order by (c.upvotes-c.downvotes) desc,c.upvotes desc,c.id limit 1
    ) best on true
    where i.published and i.upvotes+i.downvotes>0
    order by (i.upvotes-i.downvotes) desc,i.upvotes desc,i.id
    limit 10
  ),
  eligible_images as (
    select i.* from public.caption_images i
    where (select count(distinct c.style) from public.captions c
      where c.image_id=i.id and c.style in (select style from styles))=3
  ),
  page_images as (
    select * from eligible_images order by created_at desc,id
    limit 12 offset ((p_page-1)*12)
  ),
  image_breakdown as (
    select i.id,i.alt_text,i.published,i.created_at,
      (select jsonb_agg(jsonb_build_object(
        'style',s.style,'label',s.label,
        'upvotes',coalesce(stats.upvotes,0),'downvotes',coalesce(stats.downvotes,0),
        'votes',coalesce(stats.votes,0),
        'captions',coalesce(stats.captions,'[]'::jsonb)
      ) order by s.position)
      from styles s left join lateral (
        select sum(c.upvotes) upvotes,sum(c.downvotes) downvotes,sum(c.votes) votes,
          jsonb_agg(jsonb_build_object('text',c.text,'active',c.active) order by c.active desc,c.id) captions
        from caption_scores c where c.image_id=i.id and c.style=s.style
      ) stats on true) as styles
    from page_images i
  ),
  post_days as (
    select (created_at at time zone 'UTC')::date as day,count(*) as posts
    from public.caption_images where created_at >= first_day::timestamp at time zone 'UTC' group by 1
  ),
  event_days as (
    select (created_at at time zone 'UTC')::date as day,
      count(*) filter(where value is not null) as vote_actions,
      count(*) filter(where value is null) as vote_removals
    from public.caption_vote_events where created_at >= first_day::timestamp at time zone 'UTC' group by 1
  ),
  activity as (
    select first_day+n as day,coalesce(p.posts,0) as posts,
      coalesce(e.vote_actions,0) as vote_actions,coalesce(e.vote_removals,0) as vote_removals
    from generate_series(0,today-first_day) n
    left join post_days p on p.day=first_day+n
    left join event_days e on e.day=first_day+n
  )
  select jsonb_build_object(
    'generated_at',now(),
    'totals',jsonb_build_object(
      'users',(select count(*) from public.profiles),
      'posts',(select count(*) from public.caption_images),
      'published_posts',(select count(*) from public.caption_images where published),
      'votes',(select count(*) from public.caption_votes)
    ),
    'activity',coalesce((select jsonb_agg(to_jsonb(a) order by a.day) from activity a),'[]'::jsonb),
    'top_posts',coalesce((select jsonb_agg(to_jsonb(r) order by (r.upvotes-r.downvotes) desc,r.upvotes desc,r.id) from ranked_images r),'[]'::jsonb),
    'styles',(select jsonb_agg(jsonb_build_object('style',s.style,'label',s.label,
      'upvotes',(select coalesce(sum(upvotes),0) from caption_scores where style=s.style),
      'downvotes',(select coalesce(sum(downvotes),0) from caption_scores where style=s.style),
      'votes',(select coalesce(sum(votes),0) from caption_scores where style=s.style)
    ) order by s.position) from styles s),
    'style_images',coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc,i.id) from image_breakdown i),'[]'::jsonb),
    'style_image_count',(select count(*) from eligible_images),
    'other_style_votes',(select coalesce(sum(votes),0) from caption_scores where style not in (select style from styles))
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_dashboard(integer,integer) from public,anon,authenticated;
grant execute on function public.admin_dashboard(integer,integer) to authenticated;
comment on function public.admin_dashboard(integer,integer) is
  'Admin-only aggregates. Current votes for totals/approval; immutable vote events for UTC activity. Checks live membership.';
commit;
