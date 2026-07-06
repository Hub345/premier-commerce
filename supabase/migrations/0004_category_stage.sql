-- ════════════════════════════════════════════════════════════════════════
-- 0004 category stage — per-category hero ("Stage") metadata
-- Each category becomes a specialized boutique: its own headline, gradient,
-- and (optionally) a flagship product image. Tenant-configurable per row.
-- ════════════════════════════════════════════════════════════════════════

alter table categories
  add column hero_kicker    text,
  add column hero_headline  text,
  add column hero_image_url text,
  add column hero_bg        text,
  add column stage_config   jsonb not null default '{}'::jsonb;

-- Seed the Bizrah top-level category stages.
update categories set
  hero_kicker = 'Phones & Tablets',
  hero_headline = 'Power in your pocket.',
  hero_bg = 'linear-gradient(160deg,#F6F1EA,#FBF9F5)'
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'phones';

update categories set
  hero_kicker = 'Televisions',
  hero_headline = 'Cinema-grade clarity.',
  hero_bg = 'linear-gradient(160deg,#E7EFF3,#F6FAFB)'
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'televisions';

update categories set
  hero_kicker = 'Computers',
  hero_headline = 'Built to perform.',
  hero_bg = 'linear-gradient(160deg,#EDEEE8,#FAFAF6)'
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'computers';

update categories set
  hero_kicker = 'Audio',
  hero_headline = 'Hear everything.',
  hero_bg = 'linear-gradient(160deg,#EFEBF3,#FAF8FC)'
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'audio';

update categories set
  hero_kicker = 'Home Appliances',
  hero_headline = 'Your home, upgraded.',
  hero_bg = 'linear-gradient(160deg,#E8F1EC,#F6FBF8)'
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'appliances';

update categories set
  hero_kicker = 'Accessories',
  hero_headline = 'The finishing touch.',
  hero_bg = 'linear-gradient(160deg,#F4EEE7,#FBF8F4)'
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'accessories';
