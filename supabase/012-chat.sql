-- Chat feature: messages between the two parties of an accepted share request.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Messages table
create table if not exists public.messages (
  id             uuid         primary key default gen_random_uuid(),
  request_id     uuid         not null references public.share_requests(id) on delete cascade,
  sender_id      uuid         not null references public.profiles(id),
  content        text         not null check (char_length(trim(content)) between 1 and 2000),
  created_at     timestamptz  not null default now()
);

-- 2. Per-conversation, per-user read cursor (tracks last-read message timestamp)
create table if not exists public.message_reads (
  request_id    uuid        not null references public.share_requests(id) on delete cascade,
  user_id       uuid        not null references public.profiles(id),
  last_read_at  timestamptz not null default now(),
  primary key (request_id, user_id)
);

-- 3. Indexes
create index if not exists messages_request_created_idx
  on public.messages(request_id, created_at);

-- 4. Enable RLS
alter table public.messages       enable row level security;
alter table public.message_reads  enable row level security;

-- ─── messages policies ───────────────────────────────────────────────────────

-- SELECT: both parties of the accepted request may read
drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.share_requests sr
      where sr.id = request_id
        and sr.status = 'accepted'
        and (sr.owner_id = auth.uid() or sr.requester_id = auth.uid())
    )
  );

-- INSERT: only the sender, who must be a party to the accepted request
drop policy if exists "messages_insert_parties" on public.messages;
create policy "messages_insert_parties"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.share_requests sr
      where sr.id = request_id
        and sr.status = 'accepted'
        and (sr.owner_id = auth.uid() or sr.requester_id = auth.uid())
    )
  );

-- No UPDATE / DELETE (immutable chat history)

-- ─── message_reads policies ───────────────────────────────────────────────────

drop policy if exists "message_reads_own" on public.message_reads;
create policy "message_reads_own"
  on public.message_reads for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── 5. Helper: unread message count for current user ────────────────────────
-- Returns count of messages across all accepted requests where:
--   - sender is not the current user
--   - created_at is after the user's last_read_at for that request (or any message if never read)
drop function if exists public.my_unread_message_count();

create or replace function public.my_unread_message_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.messages m
  inner join public.share_requests sr
    on sr.id = m.request_id
   and sr.status = 'accepted'
   and (sr.owner_id = auth.uid() or sr.requester_id = auth.uid())
  left join public.message_reads mr
    on mr.request_id = m.request_id
   and mr.user_id = auth.uid()
  where m.sender_id <> auth.uid()
    and (mr.last_read_at is null or m.created_at > mr.last_read_at);
$$;

grant execute on function public.my_unread_message_count() to authenticated;

-- ─── 6. Enable realtime for messages ─────────────────────────────────────────
-- Run in Supabase dashboard > Database > Replication and enable the messages table,
-- OR uncomment the line below if using supabase CLI with replication:
-- alter publication supabase_realtime add table public.messages;
