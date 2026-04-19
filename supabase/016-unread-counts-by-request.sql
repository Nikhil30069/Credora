-- Per–share-request unread counts for the current user (for Chat button badges).
-- Same logic as my_unread_message_count(), scoped to one or more request IDs.

drop function if exists public.my_unread_counts_for_requests(uuid[]);

create or replace function public.my_unread_counts_for_requests(req_ids uuid[])
returns table (
  request_id uuid,
  unread_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with authorized as (
    select sr.id as rid
    from public.share_requests sr
    where sr.id = any(req_ids)
      and sr.status = 'accepted'
      and (sr.owner_id = auth.uid() or sr.requester_id = auth.uid())
  )
  select
    a.rid as request_id,
    (
      select count(*)::bigint
      from public.messages m
      left join public.message_reads mr
        on mr.request_id = m.request_id
       and mr.user_id = auth.uid()
      where m.request_id = a.rid
        and m.sender_id <> auth.uid()
        and (mr.last_read_at is null or m.created_at > mr.last_read_at)
    ) as unread_count
  from authorized a;
$$;

grant execute on function public.my_unread_counts_for_requests(uuid[]) to authenticated;
