-- Add duration field to share_requests for subscription/streaming requests
-- (e.g. "1 month", "2 weeks"). Credit-card requests keep using amount + platform + purpose.
alter table public.share_requests
  add column if not exists duration text;
