-- Gate access: user must pass credit-card BIN verification at signup (or /verify-card).
-- Grandfather existing profiles so current users are not locked out.

alter table public.profiles
  add column if not exists signup_card_bin_verified_at timestamptz;

update public.profiles
set signup_card_bin_verified_at = coalesce(signup_card_bin_verified_at, created_at)
where signup_card_bin_verified_at is null;
