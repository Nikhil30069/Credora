-- Credora schema (idempotent). Apply with: npm run db:apply (needs DATABASE_URL)
-- or paste into Supabase SQL Editor. Stores only non-sensitive card metadata.

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Auth: auto-create profile (runs as definer; bypasses RLS on profiles)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Cards (searchable pool; metadata only)
-- -----------------------------------------------------------------------------
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  brand text not null,
  last_four text not null check (char_length(last_four) = 4 and last_four ~ '^[0-9]{4}$'),
  nickname text not null,
  issuer text,
  created_at timestamptz not null default now()
);

create index if not exists cards_owner_id_idx on public.cards (owner_id);
create index if not exists cards_brand_lower_idx on public.cards (lower(brand));
create index if not exists cards_issuer_lower_idx on public.cards (lower(coalesce(issuer, '')));

alter table public.cards enable row level security;

drop policy if exists "cards_select_authenticated" on public.cards;
create policy "cards_select_authenticated"
  on public.cards for select to authenticated
  using (true);

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own"
  on public.cards for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own"
  on public.cards for update to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own"
  on public.cards for delete to authenticated
  using (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- Share requests
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.share_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.share_requests (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status public.share_request_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  constraint share_requests_requester_not_owner check (requester_id <> owner_id)
);

create unique index if not exists share_requests_one_pending_per_card_requester
  on public.share_requests (card_id, requester_id)
  where status = 'pending';

create index if not exists share_requests_owner_idx on public.share_requests (owner_id, status);
create index if not exists share_requests_requester_idx on public.share_requests (requester_id);

alter table public.share_requests enable row level security;

drop policy if exists "share_requests_select_participants" on public.share_requests;
create policy "share_requests_select_participants"
  on public.share_requests for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = owner_id);

drop policy if exists "share_requests_insert_by_requester" on public.share_requests;
create policy "share_requests_insert_by_requester"
  on public.share_requests for insert to authenticated
  with check (
    auth.uid() = requester_id
    and owner_id = (select c.owner_id from public.cards c where c.id = card_id)
  );

drop policy if exists "share_requests_update_participants" on public.share_requests;
drop policy if exists "share_requests_owner_update" on public.share_requests;
drop policy if exists "share_requests_requester_cancel" on public.share_requests;

-- Owner can update rows for their cards (accept / decline / corrections)
create policy "share_requests_owner_update"
  on public.share_requests for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Requester may only move pending → cancelled
create policy "share_requests_requester_cancel"
  on public.share_requests for update to authenticated
  using (auth.uid() = requester_id and status = 'pending')
  with check (auth.uid() = requester_id and status = 'cancelled');

-- Counterpart emails for share flows (add after share_requests exists)
drop policy if exists "profiles_select_share_counterpart" on public.profiles;
create policy "profiles_select_share_counterpart"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.share_requests sr
      where
        (sr.owner_id = auth.uid() and sr.requester_id = profiles.id)
        or (sr.requester_id = auth.uid() and sr.owner_id = profiles.id)
    )
  );
