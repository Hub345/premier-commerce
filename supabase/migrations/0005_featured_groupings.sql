-- ════════════════════════════════════════════════════════════════════════
-- 0005 featured groupings — the "Grand Gallery" Shop page
-- A category becomes a featured bento block simply by flagging the row;
-- ordering is explicit so the gallery's story is curated, not incidental.
-- ════════════════════════════════════════════════════════════════════════

alter table categories
  add column is_featured  boolean not null default false,
  add column featured_rank integer;

create index categories_featured_idx
  on categories (business_id, featured_rank)
  where is_featured;

-- Feature Bizrah's top-level categories, in gallery order.
update categories set is_featured = true, featured_rank = 1
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'televisions';

update categories set is_featured = true, featured_rank = 2
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'phones';

update categories set is_featured = true, featured_rank = 3
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'computers';

update categories set is_featured = true, featured_rank = 4
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'audio';

update categories set is_featured = true, featured_rank = 5
where business_id = '11111111-1111-1111-1111-111111111111' and slug = 'appliances';
