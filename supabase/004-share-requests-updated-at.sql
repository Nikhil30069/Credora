-- Track last change on share_requests (acceptance time) for login notifications.
-- add column without default first so existing rows can be backfilled from created_at.

alter table public.share_requests
  add column if not exists updated_at timestamptz;

update public.share_requests
set updated_at = created_at
where updated_at is null;

alter table public.share_requests
  alter column updated_at set default now();

alter table public.share_requests
  alter column updated_at set not null;

create or replace function public.share_requests_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists share_requests_set_updated_at on public.share_requests;
create trigger share_requests_set_updated_at
  before update on public.share_requests
  for each row execute function public.share_requests_set_updated_at();
