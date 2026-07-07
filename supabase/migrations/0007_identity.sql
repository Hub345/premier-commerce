-- ════════════════════════════════════════════════════════════════════════
-- 0007 identity — the Zenith Gatekeeper (customer accounts).
--
-- No new tables. `profiles` (global identity: full_name/avatar_url, already
-- auto-provisioned by the `on_auth_user_created` trigger) and `customers`
-- (business_id-scoped, already linkable via `auth_user_id`) were designed
-- from day one to carry exactly this. A shopper's tenant membership is a
-- `customers` row with `auth_user_id` set — the same row a guest checkout
-- would eventually reference, just linked to a real session instead of a
-- bare phone number.
-- ════════════════════════════════════════════════════════════════════════

-- Member sign-up collects a name + email before any phone number exists —
-- phone is still required for guest/checkout rows, just not for this path.
alter table customers
  alter column phone drop not null,
  add column marketing_opt_in boolean not null default false,
  add column terms_accepted_at timestamptz;

-- One linked customer row per (business, auth user). Partial index: guest
-- rows (auth_user_id null) are untouched and can still repeat freely.
create unique index customers_business_authuser_uidx
  on customers (business_id, auth_user_id)
  where auth_user_id is not null;
