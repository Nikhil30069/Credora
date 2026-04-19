-- Fix: share_requests insert policy queried global_asset_providers directly,
-- but authenticated users have no SELECT on that table (by design).
-- Wrap the check in a security-definer function so the policy can use it safely.

create or replace function public.is_global_provider(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.global_asset_providers
    where profile_id = target_user_id
  );
$$;

grant execute on function public.is_global_provider(uuid) to authenticated;

-- Re-create the insert policy using the helper instead of a direct table scan
drop policy if exists "share_requests_insert_by_requester" on public.share_requests;
create policy "share_requests_insert_by_requester"
  on public.share_requests for insert to authenticated
  with check (
    auth.uid() = requester_id
    and owner_id = (select c.owner_id from public.cards c where c.id = card_id)
    and (
      exists (
        select 1 from public.profiles p
        where p.id = owner_id
          and p.domain = public.user_domain()
      )
      or public.is_global_provider(owner_id)
    )
  );
