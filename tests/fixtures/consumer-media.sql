-- Consumer schema fixture copied from migrations 006-010; no hosted data.
-- Profiles/auth are supplied by the local test harness.
create table public.caption_batches (
  id uuid primary key, name text not null, provenance jsonb not null,
  created_at timestamptz not null default now()
);
create table public.caption_images (
  id uuid primary key, storage_path text not null unique,
  alt_text text not null, source_sha256 text not null check(length(source_sha256)=64),
  hosted_sha256 text not null check(length(hosted_sha256)=64),
  hosted_bytes integer not null check(hosted_bytes > 0 and hosted_bytes <= 256000),
  provenance jsonb not null, published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.caption_runs (
  id uuid primary key, image_id uuid not null references public.caption_images(id),
  batch_id uuid references public.caption_batches(id), provenance jsonb not null,
  created_at timestamptz not null default now(), unique(id,image_id)
);
create table public.captions (
  id uuid primary key, image_id uuid not null references public.caption_images(id),
  run_id uuid not null, text text not null check(char_length(text) between 1 and 500),
  style text not null check(style in ('dry_self_deprecating','internet_voice','college_twist')),
  active boolean not null default false, provenance jsonb not null,
  foreign key(run_id,image_id) references public.caption_runs(id,image_id),
  unique(id,image_id)
);
create unique index captions_active_style on public.captions(image_id,style) where active;
create table public.review_exposures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_id uuid not null references public.caption_images(id),
  caption_ids uuid[] not null check(cardinality(caption_ids)=3),
  created_at timestamptz not null default now(), unique(id,user_id)
);
create index review_exposures_user on public.review_exposures(user_id,created_at desc);
create table public.caption_impressions (
  exposure_id uuid not null references public.review_exposures(id) on delete cascade,
  caption_id uuid not null references public.captions(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  position smallint not null check(position between 1 and 3),
  seen_at timestamptz not null default now(), primary key(exposure_id,caption_id),
  foreign key(exposure_id,user_id) references public.review_exposures(id,user_id)
);
create table public.caption_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption_id uuid not null references public.captions(id),
  value smallint not null check(value in (-1,1)),
  exposure_id uuid not null,
  updated_at timestamptz not null default now(), primary key(user_id,caption_id),
  foreign key(exposure_id,user_id) references public.review_exposures(id,user_id),
  foreign key(exposure_id,caption_id) references public.caption_impressions(exposure_id,caption_id)
);
create table public.caption_vote_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption_id uuid not null references public.captions(id),
  exposure_id uuid not null,
  value smallint check(value in (-1,1)), created_at timestamptz not null default now(),
  foreign key(exposure_id,user_id) references public.review_exposures(id,user_id),
  foreign key(exposure_id,caption_id) references public.caption_impressions(exposure_id,caption_id)
);
create index caption_vote_events_user on public.caption_vote_events(user_id,created_at desc);


alter table public.captions add column generated_by uuid references public.profiles(id);
alter table public.captions drop constraint captions_style_check;
alter table public.captions add constraint captions_style_check
  check(style in ('dry_self_deprecating','internet_voice','college_twist','on_demand'));
alter table public.captions add constraint captions_generated_owner_check
  check((style='on_demand') = (generated_by is not null));
drop index public.captions_active_style;
create unique index captions_active_style on public.captions(image_id,style)
  where active and generated_by is null;

create table public.caption_generation_requests (
  id uuid primary key,
  user_id uuid not null references public.profiles(id),
  image_id uuid not null references public.caption_images(id),
  source_exposure_id uuid not null references public.review_exposures(id),
  tone smallint not null check(tone between 0 and 100),
  status text not null default 'pending' check(status in ('pending','succeeded','failed')),
  prompt jsonb, provider text, model text, provider_response jsonb, error_code text,
  caption_id uuid references public.captions(id),
  result_exposure_id uuid references public.review_exposures(id),
  created_at timestamptz not null default now(), completed_at timestamptz,
  check(status <> 'succeeded' or (caption_id is not null and result_exposure_id is not null
    and prompt is not null and provider_response is not null and model is not null))
);
create index generation_requests_user_time on public.caption_generation_requests(user_id,created_at desc);
create index generation_requests_image_user on public.caption_generation_requests(image_id,user_id,completed_at desc)
  where status='succeeded';

alter table public.caption_images add column ai_generated boolean not null default false;

create table public.image_generation_requests (
  id uuid primary key,
  user_id uuid not null references public.profiles(id),
  prompt text not null check(char_length(prompt) between 5 and 1000),
  status text not null default 'pending' check(status in ('pending','ready','shared','failed')),
  provider text, model text, provider_request jsonb, provider_response jsonb,
  artifact jsonb, error_code text,
  image_id uuid unique references public.caption_images(id),
  published_caption text,
  created_at timestamptz not null default now(), completed_at timestamptz,
  check(status not in ('ready','shared') or (image_id is not null and artifact is not null
    and provider_request is not null and provider_response is not null and model is not null))
);
create index image_generation_user_time on public.image_generation_requests(user_id,created_at desc);
create index image_generation_time on public.image_generation_requests(created_at desc);
alter table public.caption_images add column uploaded_by uuid references public.profiles(id);
alter table public.captions add column authored_by uuid references public.profiles(id);
alter table public.captions drop constraint captions_style_check;
alter table public.captions add constraint captions_style_check check(style in ('dry_self_deprecating','internet_voice','college_twist','on_demand','human'));
alter table public.captions add constraint captions_human_author_check check((style='human')=(authored_by is not null));
drop index public.captions_active_style;
create unique index captions_active_style on public.captions(image_id,style) where active and generated_by is null and authored_by is null;
create unique index captions_one_human_per_user_image on public.captions(authored_by,image_id) where authored_by is not null;
create unique index captions_one_generation_per_user_image on public.captions(generated_by,image_id) where generated_by is not null;
alter table public.review_exposures drop constraint review_exposures_caption_ids_check;
alter table public.review_exposures add constraint review_exposures_caption_ids_check check(cardinality(caption_ids) between 0 and 64);
alter table public.caption_impressions drop constraint caption_impressions_position_check;
alter table public.caption_impressions add constraint caption_impressions_position_check check(position between 1 and 64);
