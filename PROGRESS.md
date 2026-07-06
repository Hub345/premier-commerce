# Premier Commerce — Progress

Multi-tenant commerce platform. **Bizrah Electronics** is tenant #1; the platform
is built so tenant #500 needs no re-architecture. Full architecture doc:
[`docs/architecture.html`](docs/architecture.html).

Status legend: ✅ done & verified · 🟡 partial · ⬜ not started

---

## Approved architecture decisions

- **Multi-tenancy** — design the schema for many tenants now; hardcode Bizrah as
  tenant #1; defer provisioning/onboarding UI.
- **Checkout** — guest, phone-first (no forced accounts).
- **Payments** — Bizrah's own M-Pesa Paybill/Till (per-tenant Daraja creds), not
  an aggregator.
- **API** — thin BFF (Next.js route handlers) exposing a versioned `v1` contract
  consumed by web now, Flutter later.
- **Variants** — first-class (stock/price/SKU/images/attributes on the variant).
- **Search** — Postgres FTS behind a `SearchProvider` abstraction (swap to
  Meilisearch/Algolia later, no frontend change).
- **Design** — storefront is a **light** premium-retail aesthetic with a
  **product-as-hero "Stage"**; internal architecture doc stays dark.
- **Stack** — Next.js 15 + React 19 + TS + Tailwind, Supabase (Postgres/Auth/
  Storage), **npm workspaces**. Region EU-Frankfurt + Cloudflare. `geist` font,
  `framer-motion`, `zustand`.

---

## What's built

### Foundation ✅
- npm-workspaces monorepo (`apps/web`, `packages/protocol`, `packages/config`).
- `@premier/protocol` — the typed Standard Commerce Protocol (types, client
  interface, `SearchProvider`, money helpers).
- Migrations: `0001` schema + RLS + FTS + `settle_payment()`; `0002` Bizrah seed;
  `0003` subcategory tree + primary color; `0004` category "Stage" hero fields.
- Tenant middleware (Host → `business_id`, stamped server-side, never client).
- Supabase server (RLS) + service-role clients; service-role discipline documented.

### Storefront ✅
- **Theme engine** — tenant colors injected as CSS variables server-side (one DB
  row re-skins the whole site).
- **Dynamic Stage hero** — full-bleed, per-category gradient, Element-style
  headline, spotlit product plinth, Framer-Motion scene-change. Home + every
  category. Renders `hero_image_url` when present, elegant fallback otherwise.
- **Navigation** — mega-menu generated from the categories tree; top-level items
  are **direct-destination links**; hover panel with 150ms close-delay + bridge
  (flicker fixed); "Explore" tile removed.
- **Product Listing Page (Zenith Discover)** — breadcrumbs, sort, filter sidebar
  (accordions, checkboxes w/ counts, price slider+inputs, clear, removable active
  chips, mobile drawer), grid, pagination — all URL-synced + SSR.
  - **Generic, data-driven faceting** (`lib/listing.ts`): facets derived from
    product + variant attributes, so filters adapt per tenant with no code change.
- **Product detail** — variant picker, per-variant price, stock, VAT breakdown.
- **Collections carousel** — reusable scroll-snap carousel (arrows, dots, autoplay).

### Buy path ✅
- **⌘K command-palette search** (debounced, tenant-scoped FTS).
- **Cart** — Zustand + localStorage, slide-over drawer, header count.
- **Guest checkout** — phone-first; BFF `POST /api/v1/checkout` reprices from the
  DB server-side, computes VAT, stamps `business_id` under the service role.
- **M-Pesa (Daraja) 🟡** — token / STK push / status query client; routes
  `payments/mpesa/stkpush`, `.../callback` (idempotent `settle_payment`),
  `payments/status` (reconciliation poll). **Structurally complete + idempotent
  but NOT live-tested** — needs real Daraja consumer key/secret + a public
  callback URL. Without them, checkout still places the order and degrades gracefully.
- Order confirmation + guest lookup.

### API (v1) ✅
`health`, `catalog/products`, `catalog/search`, `products` (facets), `checkout`,
`payments/mpesa/stkpush`, `payments/mpesa/callback`, `payments/status`,
`orders/lookup`.

### Preview / DX ✅
- `npm run dev` with **no Supabase env** renders the full Bizrah storefront from a
  fixture (`lib/demo-data.ts`) — no Docker needed. Real DB path untouched when
  configured (every accessor gated on `hasSupabaseEnv()`).

**Verification:** `npm run typecheck` and `npm run build` green; storefront
verified live in the browser preview across home, category/PLP, product, cart,
search, and Stage.

---

## Not yet built (see [`ROADMAP.md`](ROADMAP.md))

- ⬜ Owner **Google auth** + **admin console**.
- ⬜ `/api/v1/admin/*` (for the Flutter app).
- ⬜ Image uploads to Supabase Storage (product photos + Stage hero PNGs).
- ⬜ Real Daraja credentials + Safaricom production go-live.
- ⬜ Flutter admin app.
