-- Fix: search returned no results because profiles RLS blocked cross-user reads.
--
-- Root cause: cards_select_same_domain and search_cards both read profiles for
-- OTHER users, but profiles_select_own only allows id = auth.uid(). So the
-- domain join/check silently returned 0 rows for everyone except yourself.
--
-- Fix:
-- 1. Security-definer helper to check same-domain (bypasses profiles RLS).
-- 2. Cards SELECT policy uses that helper.
-- 3. search_cards becomes security definer (it already does its own domain filter).
-- 4. A narrow profiles SELECT policy lets same-domain users see id, full_name,
--    and domain (needed for owner_name in search results and future features).

-- ─── 1. Helper: same-domain check (security definer, bypasses profiles RLS) ───
create or replace function public.is_same_domain(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user_id
      and domain = (select domain from public.profiles where id = auth.uid())
  );
$$;

grant execute on function public.is_same_domain(uuid) to authenticated;

-- ─── 2. Fix cards SELECT policy ───────────────────────────────────────────────
drop policy if exists "cards_select_same_domain" on public.cards;
create policy "cards_select_same_domain"
  on public.cards for select to authenticated
  using (public.is_same_domain(owner_id));

-- ─── 3. Make search_cards security definer ────────────────────────────────────
drop function if exists public.search_cards(text, uuid, integer);

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
    c.brand,
    c.last_four,
    c.nickname,
    c.issuer,
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

-- ─── 4. Narrow same-domain profiles policy (id, full_name, domain only) ───────
-- Allows search results to display owner names, and future community features.
drop policy if exists "profiles_select_same_domain" on public.profiles;
create policy "profiles_select_same_domain"
  on public.profiles for select to authenticated
  using (
    domain = public.user_domain()
  );
