-- ════════════════════════════════════════════════════════════════════════
-- 0011 business invites — Phase A's real deliverable: an admin invites a
-- teammate by email instead of the owner running a manual SQL insert.
--
-- No email-sending infra exists yet (Resend/SendGrid not configured, and
-- Supabase's own shared SMTP is rate-limited — see ROADMAP). So this is
-- self-service on the INVITEE's side instead of push-notification: an
-- existing admin creates the row, and the moment the invited email signs in
-- and hits /admin, the app auto-provisions their business_members row and
-- marks the invite accepted. No token/link to distribute, nothing to email.
-- ════════════════════════════════════════════════════════════════════════

create table business_invites (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email       text not null,
  role        member_role not null default 'staff',
  invited_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (business_id, email)
);

create index business_invites_business_idx on business_invites (business_id);

alter table business_invites enable row level security;

-- Only existing members can see/manage invites for their own business.
-- The auto-accept step (an invitee who isn't a member yet) goes through the
-- service role from the API route, which bypasses this — same discipline as
-- every other privileged write in this app.
create policy business_invites_member_all on business_invites
  for all to authenticated
  using (is_business_member(business_id))
  with check (is_business_member(business_id));
