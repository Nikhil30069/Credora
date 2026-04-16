-- Popular assets in the caller's domain (for search landing / discovery).
-- Groups by brand + asset_type + plan_tier; counts distinct owners sharing that bucket.

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
      and po.domain = (select pr.domain from public.profiles pr where pr.id = exclude_owner)
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
