# Premier Commerce — Roadmap

Sequenced plan going forward. Customer-facing storefront is MVP-complete (see
[`PROGRESS.md`](PROGRESS.md)); the remaining work is the owner side, media, and
go-live. Phases are gated on review, per the project's working style.

---

## Phase A — Owner access & admin console
**Goal:** a business owner can sign in and manage their store.
- Google Sign-In via Supabase Auth; auto-provision `profiles` (trigger exists).
- Authorization via `business_members` (owner/manager/staff) — decouple auth from
  membership so multiple staff/roles work later.
- Minimal admin console (web) scoped to the owner's `business_id`:
  - Product + variant CRUD, inventory adjustments (writes the `inventory_logs` ledger).
  - Category + Stage editor (hero headline/gradient/image per category).
  - Orders list + status updates.
- **`/api/v1/admin/*`** — versioned endpoints (the Flutter app will consume these).

## Phase B — Media
**Goal:** real imagery replaces initials/fallbacks.
- Supabase Storage buckets (tenant-scoped paths); signed-URL uploads from admin.
- Product images + transparent **Stage `hero_image_url`** PNGs per category.
- Next/Image optimization; Cloudflare in front.

## Phase C — Payments go-live
**Goal:** real money moves.
- Load Bizrah's production Daraja consumer key/secret into
  `business_payment_configs` (encrypted at rest — pgsodium/Vault).
- Public HTTPS `MPESA_CALLBACK_BASE_URL`; submit Safaricom production go-live
  (external dependency, days–weeks).
- End-to-end test STK push → callback → `settle_payment` → stock decrement.

## Phase D — Launch Bizrah
- Deploy to Vercel; Supabase Pro; Cloudflare edge caching.
- Core Web Vitals pass; SEO metadata + sitemap; accessibility sweep.
- Custom domain (`bizrah.co.ke`) — deferred from Phase 1 per plan.

## Phase E — Second tenant (validate multi-tenancy)
- Tenant provisioning flow (create business row, seed categories, set branding/Stage).
- Prove "add a row → new storefront" with a non-electronics tenant to validate the
  generic faceting (e.g. furniture → Material/Dimensions surface automatically).

## Phase F — Flutter admin app
- Consume `/api/v1/admin/*`; Google login; inventory, orders, analytics,
  push notifications, low-stock alerts, tax/VAT reports.

---

## Known follow-ups / tech notes
- **Listing at scale:** faceting/filter/sort/pagination currently runs in the BFF
  over the tenant's product set (fine for MVP). For huge catalogs, move behind the
  existing `SearchProvider` seam (Meilisearch/Algolia) — no frontend change.
- **Faceted counts** currently reflect the full category set (stable options);
  upgrade to per-facet contextual counts if desired.
- **Clean URLs** (`/televisions` vs `/category/televisions`) — optional; via a
  route or allowlisted rewrite.
- **Payments not live-tested** until Daraja creds land (Phase C).
