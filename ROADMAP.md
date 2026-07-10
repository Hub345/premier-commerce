# Premier Commerce — Roadmap

Sequenced plan going forward. Customer-facing storefront is MVP-complete (see
[`PROGRESS.md`](PROGRESS.md)); the remaining work is the owner side, media, and
go-live. Phases are gated on review, per the project's working style.

---

## Phase A — Owner access & admin console ✅ done
**Goal:** a business owner can sign in and manage their store.
- Email/password + Google Sign-In (code path) via Supabase Auth; auto-provision
  `profiles` (trigger). Apple deferred (needs a paid Developer account).
- Authorization via `business_members` (owner/manager/staff) — decoupled from
  auth, so multiple staff/roles work. **Self-service invites** (Team tab,
  owner-only): invite by email + role, no email sent — the invitee is
  auto-provisioned the moment they sign in and open `/admin`. Role changes and
  removal, guarded against stranding a business with zero owners.
- Admin console (`/admin`, the "Zenith Command Center") scoped to the owner's
  `business_id`: full product + variant CRUD with image upload (Atomic Vault),
  category/brand tree management at any depth (Stage Manager), Stage hero
  editor, theme/wording/benefits/social — all real, all built.
- **`/api/v1/admin/*`** — versioned endpoints (the Flutter app will consume
  these later).
- **Remaining, not done:** an Orders list + status-update view in the admin
  console (checkout/payments exist; there's no admin-side order management UI
  yet). Google/Apple OAuth still need real external credentials before they're
  live (code is ready — see Known follow-ups).

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
- **Apple Sign-In** — button is built and disabled ("coming soon"); needs a
  paid Apple Developer account + Services ID + private key before it's real.
- **Google OAuth** — code path is wired (`signInWithOAuth`); needs a Google
  Cloud OAuth client ID/secret pasted into Supabase's Auth provider settings
  before it's live (same "code ready, external credential missing" shape as
  M-Pesa).
- **Member orders aren't linked yet** — checkout still keys by phone; a
  signed-in member's `customers` row isn't attached to the order they place.
  Needed before `/account/orders` can show real history instead of "coming soon".
- **Inline visual editor — done (2026-07-10).** Click-to-edit pencils on the
  live Stage preview (kicker/headline/background/image, home + every
  category) plus a sidebar drag-to-reorder for the Grand Gallery — see
  `PROGRESS.md` for the full writeup.
- **Visual Architect "quick wins" — done (2026-07-10).** After the full
  "Universe Creator" WYSIWYG brief was re-sent, the two no-regret pieces
  that sit on the current architecture shipped: **video/image Stage
  backgrounds** (new `site-media` bucket, migration `0012`, "drop a video on
  the hero" via the existing HUD) and the **"Go Live" setup-progress
  sidebar** (real-state launch checklist). See `PROGRESS.md`.
- **Full `layout_json` visual builder — still deferred (needs greenlight +
  design doc).** The generic block renderer, true in-canvas cross-iframe
  drag-and-drop, Slate rich-text, template gallery, and undo/redo would
  rebuild the bespoke SSR storefront as generic blocks — a product-shape
  decision, not a feature. Not started. (Note: the brief's `tenant_configs`
  table doesn't exist here — rejected early as fragmentation — so any layout
  manifest would live at `businesses.layout_json`.)
- **Owner-invite flow — done (2026-07-10).** The manual one-line SQL insert
  (shown on `/admin`'s access-denied screen) is now only needed to bootstrap
  the very first owner of a business (nobody exists yet to invite them).
  Every subsequent teammate is a real self-service invite from the Team tab.
- **Command Center — all four archetypes now built.** Archetype 1 "Glass
  Cockpit" shipped as **Pulse** (2026-07-10) — a real-data dashboard over
  sales, inventory, customers, and catalog (see `PROGRESS.md`). Archetype 2
  "Stage Manager" and Archetype 3 "Atomic Vault" (full product CRUD incl.
  image upload, categories/brands at any depth, variants) were already built.
  **The one remaining cockpit gap is web-traffic analytics** (visitors,
  sources, geo-IP traffic map, realtime visitor counts) — deliberately not
  faked; it needs a dedicated event-ingestion pipeline (client beacon →
  events table → rollups), which is its own next phase, not started.
- **Rewards / Favorites / Manage Subscriptions** — routes exist, intentionally
  un-implemented (points ledger, wishlist table, subscription granularity are
  each their own phase).
- **Mega-menu flyout still shows only 2 levels visually** — category data
  supports any depth (brands included) and the admin can create them, but the
  hover flyout panel itself hasn't been redesigned for a 3rd visual tier yet.
  A brand is still reachable via its parent category's own subcategory-pill
  row today.
- **Middleware auth-refresh perf fix (2026-07-07):** `supabase.auth.getUser()`
  was running in middleware on *every* request, including anonymous
  storefront browsing with no session to refresh — a real, measurable
  network round-trip added to every single page load. Now skipped entirely
  when no `sb-*-auth-token` cookie is present. `getCurrentMember()`'s two
  independent queries (profile + tenant membership) were also sequential;
  parallelized with `Promise.all`. Both are real fixes, not the recurring
  stale-`.next`-dev-cache issue (which is a tooling artifact, not app code —
  documented separately, fixed by clearing `.next` and restarting).
- **Category-switch sluggishness fix (2026-07-07):** reported as "~2s to
  switch category." Measured: in **production** a category→category nav is
  ~0.55s server-side (three sequential remote-Supabase round trips:
  business row → categories → products); the extra ~1.5s the user saw was
  **dev-mode** (on-demand route compilation + no link prefetch, neither of
  which exists in prod). Root UX cause: no `loading.tsx`, so a `force-dynamic`
  route left the *previous* page frozen for the whole render. Added
  `loading.tsx` skeletons for `category/[slug]` and `product/[slug]` — this
  (a) shows instant feedback on click in dev **and** prod, and (b) lets Next
  prefetch dynamic routes up to the loading boundary in prod, making the
  click near-instant. Also parallelized `SiteHeader`'s nav-tree + member
  lookups. **Remaining lever (not done, flagged):** the ~0.55s is remote-DB
  latency; caching the public catalog reads (`getCategoryWithProducts` /
  `getNavigationTree`) via `unstable_cache` + `revalidateTag` on admin writes
  would cut it further, but touches ~6 write paths (product/category/theme/
  checkout-stock) and risks stale data — deferred as premature for the
  current tiny catalog.
