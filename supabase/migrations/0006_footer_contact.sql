-- ════════════════════════════════════════════════════════════════════════
-- 0006 footer contact — the "Zenith Signature" footer's tenant-driven data.
-- Contact/social links are PUBLIC info (unlike M-Pesa secrets in
-- business_payment_configs), so they live directly on `businesses` as a
-- jsonb column — same pattern as `branding`, not a new fragmented table.
-- ════════════════════════════════════════════════════════════════════════

alter table businesses
  add column contact jsonb not null default '{}'::jsonb;

update businesses set contact = '{
  "phone": "+254700123456",
  "email": "support@bizrah.co.ke",
  "facebookUrl": "https://facebook.com/bizrahelectronics",
  "instagramUrl": "https://instagram.com/bizrahelectronics",
  "youtubeUrl": null,
  "xUrl": null
}'::jsonb
where slug = 'bizrah';

-- Newsletter capture: leads only, no PII beyond email. Locked to the
-- service role — inserts happen through the API route, never straight from
-- the browser's anon key.
create table newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  unique (business_id, email)
);

create index newsletter_subscribers_business_idx
  on newsletter_subscribers (business_id);

alter table newsletter_subscribers enable row level security;
-- No policies: only the service-role key (used by the API route) can touch
-- this table. Anon/authenticated clients get nothing, by default-deny.
