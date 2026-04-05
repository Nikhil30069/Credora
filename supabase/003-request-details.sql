-- Add structured fields to share_requests for amount, purpose, and platform.
-- Run after schema.sql and 002-fuzzy-search.sql.
-- If the app says "Could not find the 'amount' column ... in the schema cache", run this
-- in Supabase → SQL Editor, then wait ~1 min or refresh; PostgREST reloads the schema.

alter table public.share_requests
  add column if not exists amount numeric(12, 2),
  add column if not exists purpose text,
  add column if not exists platform text;
