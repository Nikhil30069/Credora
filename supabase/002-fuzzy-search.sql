-- Credora: fuzzy card search. Run after schema.sql.
-- Requires pg_trgm (enabled by default on Supabase).

create extension if not exists pg_trgm;

-- Materialized search column: brand || issuer || nickname, lowercased.
alter table public.cards add column if not exists search_text text
  generated always as (
    lower(brand || ' ' || coalesce(issuer, '') || ' ' || nickname)
  ) stored;

-- GIN trigram index for fast ILIKE / similarity lookups.
create index if not exists cards_search_trgm_idx
  on public.cards using gin (search_text gin_trgm_ops);

-- Ranked search: returns cards ordered by trigram similarity to the query,
-- filtered to a minimum threshold. Excludes the calling user's own cards.
create or replace function public.search_cards(
  query text,
  exclude_owner uuid,
  lim int default 60
)
returns table (
  id uuid,
  owner_id uuid,
  brand text,
  last_four text,
  nickname text,
  issuer text,
  created_at timestamptz,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.owner_id,
    c.brand,
    c.last_four,
    c.nickname,
    c.issuer,
    c.created_at,
    greatest(
      similarity(c.search_text, lower(query)),
      word_similarity(lower(query), c.search_text)
    ) as rank
  from public.cards c
  where c.owner_id <> exclude_owner
    and (
      c.search_text ilike '%' || lower(query) || '%'
      or similarity(c.search_text, lower(query)) > 0.08
      or word_similarity(lower(query), c.search_text) > 0.15
    )
  order by rank desc, c.created_at desc
  limit lim;
$$;
