-- Domain-based community pools.
-- Every user belongs to the community defined by their email domain.
-- Cards, search, and share requests are all scoped within a domain.

-- 1. Add domain column
alter table public.profiles
  add column if not exists domain text;

-- 2. Backfill existing rows
update public.profiles
set domain = split_part(email, '@', 2)
where domain is null;

alter table public.profiles
  alter column domain set not null;

create index if not exists profiles_domain_idx on public.profiles (domain);

-- 3. Helper: return the calling user's domain (used in RLS and functions)
create or replace function public.user_domain()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select domain from public.profiles where id = auth.uid();
$$;

-- 4. Update handle_new_user to store domain
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, domain)
  values (
    new.id,
    coalesce(new.email, ''),
    split_part(coalesce(new.email, ''), '@', 2)
  );
  return new;
end;
$$;

-- 5. Domain-scoped card visibility (replaces the old "any authenticated" policy)
drop policy if exists "cards_select_authenticated" on public.cards;
create policy "cards_select_same_domain"
  on public.cards for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = cards.owner_id
        and p.domain = public.user_domain()
    )
  );

-- 6. Domain-scoped search function (replaces old search_cards)
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
  inner join public.profiles p on p.id = c.owner_id
  where c.owner_id <> exclude_owner
    and p.domain = (select pr.domain from public.profiles pr where pr.id = exclude_owner)
    and (
      c.search_text ilike '%' || lower(query) || '%'
      or similarity(c.search_text, lower(query)) > 0.08
      or word_similarity(lower(query), c.search_text) > 0.15
    )
  order by rank desc, c.created_at desc
  limit lim;
$$;

-- 7. Share requests: ensure requester and owner are same domain
-- (The insert policy already checks owner matches card.owner_id; RLS on cards
-- now limits visibility to same domain. We also add an explicit check.)
drop policy if exists "share_requests_insert_by_requester" on public.share_requests;
create policy "share_requests_insert_by_requester"
  on public.share_requests for insert to authenticated
  with check (
    auth.uid() = requester_id
    and owner_id = (select c.owner_id from public.cards c where c.id = card_id)
    and exists (
      select 1 from public.profiles p
      where p.id = owner_id
        and p.domain = public.user_domain()
    )
  );
