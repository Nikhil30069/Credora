-- Global asset providers: selected profiles whose card listings are visible and
-- requestable from every community (not only their email domain).
--
-- Implemented as an allowlist table (not a column on profiles) so end users
-- cannot grant themselves global visibility through the normal profile update API.

-- ─── 1. Allowlist table ───────────────────────────────────────────────────────
create table if not exists public.global_asset_providers (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.global_asset_providers is
  'Profiles whose cards appear in search/popular for all domains; share requests allowed cross-domain to these owners.';

alter table public.global_asset_providers enable row level security;

-- No policies for authenticated/anon → clients cannot read or modify this table.
-- Security-definer SQL functions and the table owner (postgres) can still use it.

revoke all on table public.global_asset_providers from anon, authenticated;

-- Seed: master profile (Credora operator) — add more rows via SQL as needed.
insert into public.global_asset_providers (profile_id, note)
values (
  '9e94b98c-3254-40aa-bc7a-b6e54beca594'::uuid,
  'Master profile — listings visible across all communities'
)
on conflict (profile_id) do update set note = excluded.note;

-- ─── 2. Card visibility: same domain OR global provider ───────────────────────
create or replace function public.is_same_domain(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.global_asset_providers g
      where g.profile_id = target_user_id
    )
    or exists (
      select 1
      from public.profiles po
      where po.id = target_user_id
        and po.domain = (select me.domain from public.profiles me where me.id = auth.uid())
    );
$$;

grant execute on function public.is_same_domain(uuid) to authenticated;

drop policy if exists "cards_select_same_domain" on public.cards;
create policy "cards_select_same_domain"
  on public.cards for select to authenticated
  using (public.is_same_domain(owner_id));

-- ─── 3. Search RPC: include global providers for every viewer domain ─────────
drop function if exists public.search_cards(text, uuid, integer);

create or replace function public.search_cards(
  query text,
  exclude_owner uuid,
  lim int default 60
)
returns table (
  id uuid,
  owner_id uuid,
  asset_type text,
  brand text,
  last_four text,
  nickname text,
  issuer text,
  plan_tier text,
  created_at timestamptz,
  rank real,
  owner_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.owner_id,
    c.asset_type,
    c.brand,
    c.last_four,
    c.nickname,
    c.issuer,
    c.plan_tier,
    c.created_at,
    greatest(
      similarity(c.search_text, lower(query)),
      word_similarity(lower(query), c.search_text)
    ) as rank,
    coalesce(nullif(trim(po.full_name), ''), 'Member') as owner_name
  from public.cards c
  inner join public.profiles po on po.id = c.owner_id
  where c.owner_id <> exclude_owner
    and (
      exists (select 1 from public.global_asset_providers g where g.profile_id = po.id)
      or po.domain = (select pr.domain from public.profiles pr where pr.id = exclude_owner)
    )
    and (
      c.search_text ilike '%' || lower(query) || '%'
      or similarity(c.search_text, lower(query)) > 0.08
      or word_similarity(lower(query), c.search_text) > 0.15
    )
  order by rank desc, c.created_at desc
  limit lim;
$$;

grant execute on function public.search_cards(text, uuid, integer) to authenticated;

-- ─── 4. Popular assets: include global providers in every community feed ─────
drop function if exists public.popular_community_assets(uuid, integer);

create or replace function public.popular_community_assets(
  exclude_owner uuid,
  lim int default 12
)
returns table (
  id uuid,
  owner_id uuid,
  asset_type text,
  brand text,
  last_four text,
  nickname text,
  issuer text,
  plan_tier text,
  sharers_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped as (
    select c.*
    from public.cards c
    inner join public.profiles po on po.id = c.owner_id
    where c.owner_id <> exclude_owner
      and (
        exists (select 1 from public.global_asset_providers g where g.profile_id = po.id)
        or po.domain = (select pr.domain from public.profiles pr where pr.id = exclude_owner)
      )
  ),
  grouped as (
    select
      lower(trim(brand)) as g_brand,
      asset_type as g_type,
      coalesce(nullif(trim(plan_tier), ''), '') as g_tier,
      count(distinct owner_id)::bigint as sharers_count,
      max(created_at) as latest_at
    from scoped
    group by 1, 2, 3
  ),
  ranked as (
    select *
    from grouped
    order by sharers_count desc, latest_at desc
    limit coalesce(nullif(lim, 0), 12)
  )
  select distinct on (r.g_brand, r.g_type, r.g_tier)
    c.id,
    c.owner_id,
    c.asset_type,
    c.brand,
    c.last_four,
    c.nickname,
    c.issuer,
    c.plan_tier,
    r.sharers_count
  from ranked r
  inner join scoped c
    on lower(trim(c.brand)) = r.g_brand
    and c.asset_type = r.g_type
    and coalesce(nullif(trim(c.plan_tier), ''), '') = r.g_tier
  order by r.g_brand, r.g_type, r.g_tier, c.created_at desc;
$$;

grant execute on function public.popular_community_assets(uuid, integer) to authenticated;

-- ─── 5. Share requests: allow cross-domain when the card owner is global ─────
drop policy if exists "share_requests_insert_by_requester" on public.share_requests;
create policy "share_requests_insert_by_requester"
  on public.share_requests for insert to authenticated
  with check (
    auth.uid() = requester_id
    and owner_id = (select c.owner_id from public.cards c where c.id = card_id)
    and (
      exists (
        select 1 from public.profiles p
        where p.id = owner_id
          and p.domain = public.user_domain()
      )
      or exists (
        select 1 from public.global_asset_providers g
        where g.profile_id = owner_id
      )
    )
  );
