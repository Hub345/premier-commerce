-- ════════════════════════════════════════════════════════════════════════
-- 0012 site media — a full-bleed background image OR short video behind a
-- Stage (home hero + any category hero). Lets an admin "drop a video onto
-- the background" from the live visual editor.
--
-- Videos are bigger than product photos, so this gets its own public bucket
-- with a 50MB cap and video mime types alongside images. Same discipline as
-- product-images: public reads served straight by Storage (no read policy),
-- all writes go through the service-role upload route (no write policies).
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  52428800, -- 50MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

-- Per-category Stage background media. Home/business Stage stores its own in
-- businesses.branding (jsonb), so no column is needed there.
alter table categories add column if not exists hero_bg_media_url text;
