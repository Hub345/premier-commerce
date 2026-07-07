-- ════════════════════════════════════════════════════════════════════════
-- 0008 stage manager — the Zenith Command Center's Theme Lab.
--
-- `branding` and `contact` are already jsonb (Theming/Wording/Social all fit
-- inside them — no new columns for those). The one gap: the "Bizrah Promise"
-- benefit cards were hardcoded copy in BenefitsGallery.tsx. Made editable.
-- ════════════════════════════════════════════════════════════════════════

alter table businesses
  add column benefits jsonb not null default '[
    {"title":"Lightning Delivery","copy":"Free same-day delivery in Nairobi and its environs. From our warehouse to your door in hours."},
    {"title":"Pay on Your Terms","copy":"Payment on Delivery. Inspect your tech, then pay via M-Pesa or Cash."},
    {"title":"White-Glove Setup","copy":"Free Installation & Setup. We don''t just drop off boxes; we calibrate your experience."},
    {"title":"Genuine Warranty","copy":"Certified Authentic. Every product backed by a full manufacturer''s warranty."}
  ]'::jsonb;
