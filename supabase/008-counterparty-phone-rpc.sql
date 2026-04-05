-- Return the other party's phone only for accepted requests and when they opted in (definer; does not widen profile SELECT).
create or replace function public.counterparty_phone_for_share_request(p_request_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  sr public.share_requests%rowtype;
  viewer uuid := auth.uid();
begin
  if viewer is null then
    return null;
  end if;

  select * into sr from public.share_requests where id = p_request_id;
  if not found then
    return null;
  end if;
  if sr.status <> 'accepted' then
    return null;
  end if;

  if viewer = sr.owner_id then
    if not sr.requester_phone_visible then
      return null;
    end if;
    return (select p.phone from public.profiles p where p.id = sr.requester_id);
  elsif viewer = sr.requester_id then
    if not sr.owner_phone_visible then
      return null;
    end if;
    return (select p.phone from public.profiles p where p.id = sr.owner_id);
  end if;

  return null;
end;
$$;

grant execute on function public.counterparty_phone_for_share_request(uuid) to authenticated;
