-- Profile: display name + phone (collected at onboarding).
-- Share requests: optional phone visibility after acceptance (per party).

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone text;

alter table public.share_requests
  add column if not exists owner_phone_visible boolean not null default false,
  add column if not exists requester_phone_visible boolean not null default false;

-- Search: expose card owner display name (same domain only; enforced by join + RLS on cards).
-- Cannot change RETURNS TABLE columns with CREATE OR REPLACE; must drop first.
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

-- Toggle phone visibility for the current user on an accepted share request (owner vs requester column).
create or replace function public.set_share_request_phone_visible(
  request_id uuid,
  visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.share_requests%rowtype;
begin
  select * into r from public.share_requests where id = request_id;
  if not found then
    raise exception 'Request not found';
  end if;
  if r.status <> 'accepted' then
    raise exception 'Only accepted requests support phone sharing';
  end if;
  if auth.uid() = r.owner_id then
    update public.share_requests
    set owner_phone_visible = visible
    where id = request_id;
  elsif auth.uid() = r.requester_id then
    update public.share_requests
    set requester_phone_visible = visible
    where id = request_id;
  else
    raise exception 'Not allowed';
  end if;
end;
$$;

grant execute on function public.set_share_request_phone_visible(uuid, boolean) to authenticated;
