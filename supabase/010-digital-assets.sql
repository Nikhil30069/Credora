-- Transform Credora from credit-card-only to a multi-asset sharing platform.
-- Supports: credit cards, Netflix, Prime, Spotify, JioHotstar, and custom subscriptions.

-- ─── 1. Asset type on existing cards table ────────────────────────────────────
alter table public.cards
  add column if not exists asset_type text not null default 'credit_card';

create index if not exists cards_asset_type_idx on public.cards (asset_type);

-- ─── 2. Subscription-specific fields ──────────────────────────────────────────
alter table public.cards
  add column if not exists plan_tier text;

-- ─── 3. Relax last_four (only required for credit cards) ─────────────────────
alter table public.cards alter column last_four drop not null;

-- Drop old check constraint (auto-named; try common names)
do $$
begin
  alter table public.cards drop constraint if exists cards_last_four_check;
  alter table public.cards drop constraint if exists cards_last_four_check1;
exception when undefined_object then null;
end $$;

-- New constraint: cards must have last_four; subscriptions must not
alter table public.cards add constraint cards_last_four_typed_check check (
  case
    when asset_type = 'credit_card'
      then last_four is not null and char_length(last_four) = 4 and last_four ~ '^[0-9]{4}$'
    else true
  end
);

-- ─── 4. Regenerate search_text to include asset type & plan ───────────────────
alter table public.cards drop column if exists search_text;
alter table public.cards add column search_text text
  generated always as (
    lower(
      coalesce(asset_type, '') || ' ' ||
      brand || ' ' ||
      coalesce(issuer, '') || ' ' ||
      coalesce(plan_tier, '') || ' ' ||
      nickname
    )
  ) stored;

-- Recreate trigram index
drop index if exists cards_search_trgm_idx;
create index cards_search_trgm_idx on public.cards using gin (search_text gin_trgm_ops);

-- ─── 5. Updated search function (security definer, includes asset_type) ──────
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
    and po.domain = (select pr.domain from public.profiles pr where pr.id = exclude_owner)
    and (
      c.search_text ilike '%' || lower(query) || '%'
      or similarity(c.search_text, lower(query)) > 0.08
      or word_similarity(lower(query), c.search_text) > 0.15
    )
  order by rank desc, c.created_at desc
  limit lim;
$$;

grant execute on function public.search_cards(text, uuid, integer) to authenticated;
