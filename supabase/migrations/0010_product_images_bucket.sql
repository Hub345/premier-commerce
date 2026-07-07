-- ════════════════════════════════════════════════════════════════════════
-- 0010 product images bucket — lets the Atomic Vault upload real product
-- photos instead of the initials fallback.
--
-- Public bucket: objects are served directly by Storage's GET endpoint for
-- public buckets, bypassing RLS/PostgREST entirely — no read policy needed.
-- All writes go through the service role from our own upload API route,
-- never a direct client upload, so no insert/update/delete policies are
-- needed either (same discipline as every other admin write in this app).
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608, -- 8MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
