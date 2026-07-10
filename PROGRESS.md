# Premier Commerce — Progress

Multi-tenant commerce platform. **Bizrah Electronics** is tenant #1; the platform
is built so tenant #500 needs no re-architecture. Full architecture doc:
[`docs/architecture.html`](docs/architecture.html).

Status legend: ✅ done & verified · 🟡 partial · ⬜ not started

---

## Approved architecture decisions

- **Multi-tenancy** — design the schema for many tenants now; hardcode Bizrah as
  tenant #1; defer provisioning/onboarding UI.
- **Checkout** — guest, phone-first (no forced accounts) **remains the default**;
  optional customer accounts (below) sit alongside it, not in place of it.
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
  `0003` subcategory tree + primary color; `0004` category "Stage" hero fields;
  `0005` `is_featured`/`featured_rank` for the Grand Gallery; `0006`
  `businesses.contact` + `newsletter_subscribers` for the Zenith Signature
  footer; `0007` nullable `customers.phone` + `marketing_opt_in`/
  `terms_accepted_at` + a partial unique index for the Zenith Gatekeeper;
  `0008` `businesses.benefits` jsonb for the Command Center's editable
  "Bizrah Promise" cards; `0009` security hardening (revoked public RPC
  execute on `settle_payment`/`handle_new_user`, hardened `search_path`);
  `0010` `product-images` public Storage bucket for the Atomic Vault; `0011`
  `business_invites` for the Team owner-invite flow.
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
- **Navigation nav-row fix** — "Shop" folded into the mega-menu's pill row
  (fixed gutter, `font-semibold` to read as the master entry); every pill is
  `whitespace-nowrap` + the row is `overflow-x-auto` with a hidden scrollbar
  (`no-scrollbar` in `globals.css`) — labels never wrap mid-word, even for a
  future tenant with longer category names; the row scrolls instead.
- **The "Zenith Signature" footer** — 4-column grid: Brand + newsletter
  (`NewsletterForm.tsx`, posts to `POST /api/v1/newsletter`, `sonner` toast),
  Support links, Company links, and a Connect column (phone/email + social
  icons via `SocialLink.tsx`). Social icons only render when the tenant has
  that URL set — no dead icons.
  - **Tenant-driven contact info**, not a new `business_configs` table:
    `businesses.contact` jsonb (migration `0006`), same pattern as `branding` —
    consistent with the earlier decision to avoid config-table fragmentation.
  - `newsletter_subscribers` table, service-role-only (no RLS policies —
    default-deny; writes only happen through the API route).
  - Support/Company links point to real, lightweight content pages (`/about`,
    `/contact`, `/help`, `/warranty`, `/careers`, `/sustainability`,
    `/privacy`, `/terms`) via a shared `InfoPage` component — not placeholders.
  - `lucide-react` added for generic icons (Phone/Mail); brand/social marks
    (Facebook/Instagram/YouTube/X) are hand-drawn inline SVGs since recent
    `lucide-react` dropped brand icons — matches this codebase's existing
    inline-icon convention (see the header's account icon).
  - Header "Home" link (business name → `/`) was already correct pre-existing
    behavior; no change needed.
- **The Zenith Command Center (`/admin`)** — hidden "Stage Manager" theme
  editor. Discovery is a search-bar Easter egg (type "administrator control" +
  Enter); **the gate itself is real** — Supabase Auth + the existing
  `is_business_member()` RLS function via RPC, not a hardcoded password. A
  manual one-line SQL insert (shown on the access-denied screen) is still the
  path to bootstrap the very first owner of a business (there's no one to
  invite you yet); everyone after that is a real self-service invite — see
  **Team** below.
  - **Routing restructure:** moved all storefront pages into a
    `(storefront)` route group with its own layout (header/footer); the root
    layout is now bare. `/admin` sits outside that group — no light storefront
    chrome around the dark cockpit.
  - **Theme Lab:** Color Lab (accent/primary), Typography (Geist/Inter/
    Playfair Display — 3 preloaded fonts via `next/font/google`, not an
    arbitrary font-family string), Hero wording, the 4 "Bizrah Promise" cards
    (now tenant-editable — new `businesses.benefits` jsonb, migration `0008`),
    Social links, and per-category Stage editor (kicker/headline/bg) — all
    auto-save (800ms debounce) with a Saving/Synced/Error indicator, no Save
    button. A live-preview iframe reloads after each successful save.
  - **"Restore to Factory Defaults"** — resets branding+benefits to a shared
    `ZENITH_DEFAULTS` const, with a confirm step. Deliberately scoped to
    theme/wording only (not social links or category content).
  - **The "Aura" toggle** — Midnight/Studio dark-light switch for the admin UI
    only (`next-themes`, `attribute="class"`, `storageKey="zenith-admin-aura"`).
    Tailwind got `darkMode: "class"`. The storefront has zero `dark:` rules and
    is themed via CSS vars, so the toggle is inert there; the Stage Manager's
    live-preview iframe is a separate document, so it never inherits the
    admin's theme either — verified live (toggled Studio, preview iframe
    stayed unchanged).
  - **Atomic Vault (Archetype 03)** — full product CRUD, built and verified
    live against the real DB (create, category-assign, specs, variant, all
    confirmed via direct SQL):
    - High-density table (thumbnail, status pill, stock, price) + search.
    - **"+ Add Product"** and per-row **click-to-edit** open the same
      `ProductEditor` drawer: name/description, category (indented
      any-depth `<select>` — see below), **generic key-value specs** editor
      (writes `products.attributes` — same data-driven philosophy as PLP
      faceting), an **image uploader** (drag-in-a-file-input → new
      `POST /api/v1/admin/upload` → Supabase Storage `product-images` bucket
      → public URL), and a **variants editor** (add/remove rows; each has
      label/SKU/price/stock/on-sale/images/**own specs** — storage/color/ram
      etc.) with per-variant image upload too.
    - New products default to `status: "draft"` (safe — doesn't go live
      until reviewed) with an auto-generated, collision-checked slug.
    - Saves via `PATCH`/`POST /api/v1/admin/product` (service-role, scoped by
      `business_id`, admin-gated); after any save the Vault does a plain
      `router.refresh()` rather than hand-patching local state — variant
      add/remove reshapes data unpredictably enough that a clean re-fetch
      beats fragile optimistic merging for this editor (the fast Quick-Edit
      pattern is still optimistic where it was kept, e.g. Stage Manager's
      autosave).
    - **Storage bucket** (migration `0010`): public bucket, 8MB limit,
      image mime-types only; no RLS read policy needed (public buckets serve
      GETs directly, bypassing RLS) and no write policy needed (uploads only
      ever go through the service-role API route, never client-direct).
  - **Pulse — the "Glass Cockpit" (Archetype 01, added 2026-07-10):** the
    Command Center's default landing view, and the fourth (final) archetype
    to ship. A vital-signs dashboard built **entirely on data the platform
    already records** — no synthesized numbers. `getPulseMetrics(businessId)`
    (`lib/pulse.ts`, service-role, every query manually scoped by
    `business_id`; `order_items` scoped via an inner join on its order since
    it has no `business_id` column) aggregates five real signals: **sales**
    (gross/paid/30-day revenue, order + paid-order counts, avg order value,
    a 14-day realized-revenue trend, orders-by-status, recent-orders feed,
    top-products by revenue from `order_items`), **customers** (total, with
    an account, last-30-day), **inventory** (total units, retail value =
    Σ stock×price, low-stock + out-of-stock counts, and a low-stock
    watchlist), and **catalog** (products by status + variant count).
    `Pulse.tsx` is a purely presentational client component (KPI cards, an
    inline-SVG revenue sparkline — no chart library, an orders-by-status
    breakdown, recent-orders and low-stock lists, top-products, a catalog
    snapshot) styled to match the rest of the admin (Aura light/dark).
    **The honesty principle carries through:** with no orders yet (M-Pesa
    isn't live), the revenue/orders sections show real zeros with explicit
    empty states ("No sales yet — this chart fills in the moment your first
    M-Pesa order settles") rather than fake demo curves, while inventory,
    customers, and catalog show real numbers **right now**. **Verified live
    end-to-end** against the real DB (throwaway owner account, signed in
    through the actual UI): inventory value Ksh 14,235,689.00 / 311 units,
    14 variants, 10 published products, 1 customer — every figure matched a
    direct SQL aggregate; empty states and dark mode both confirmed; test
    account fully cleaned up after.
  - **Explicitly still deferred (the one piece Pulse doesn't cover):**
    web-traffic & audience analytics — visitors, sessions, traffic sources,
    the geo-IP traffic map, realtime websocket visitor counts. These need a
    dedicated event-ingestion pipeline (client beacon → events table →
    rollups) that doesn't exist yet, so Pulse says so in a footnote rather
    than estimating. That pipeline is the clear next phase for the cockpit.
  - **Team — owner-invite flow (Phase A's real deliverable, added
    2026-07-10):** an owner-only 4th Command Center tab. No email-sending
    infra exists (Supabase's shared SMTP is rate-limited — see below), so
    invites are self-service on the *invitee's* side instead of a
    push notification: an owner enters an email + role, which creates a
    `business_invites` row (migration `0011`); the moment that email signs in
    and opens `/admin`, `tryAcceptInvite()` matches it, creates their real
    `business_members` row with the invited role, and marks the invite
    accepted — no link or token to distribute. Role changes and removal
    (with a "can't strand a business with zero owners" guard) are in the
    same tab. **Found and fixed a real privilege-escalation gap during live
    testing:** the existing `isBusinessAdmin` check only verifies "is *a*
    member" (any role) — it already gated Stage Manager/Vault access
    correctly, but reusing it for Team would have let a `staff` invite
    promote themselves to `owner` or remove the real owner. Added
    `isBusinessOwner` (checks the actual role) and gate Team's API routes
    and the tab's visibility on that instead — verified live: a `manager`
    account can no longer see the Team tab, and a forged direct
    `POST /api/v1/admin/invite` from that same session now returns 403.
    Verified the full loop end-to-end against the real DB: owner invites a
    real second account by email → that account signs in cold (no manual
    grant) → lands straight in the Command Center with the invited role.
  - **Category tree — any depth, brands included (added 2026-07-07):**
    `categories.parent_id` self-references, so the schema always supported
    unlimited nesting; most of the storefront (breadcrumbs, subcategory pill
    rows, descendant-id expansion for a category's product listing) already
    walked it generically. Two spots were hardcoded to exactly two levels and
    got fixed: `getNavigationTree()` (mega-menu builder — now a generic
    recursive tree, `NavNode`/`NavChild` types in `nav-types.ts` made
    recursive) and the admin category `<select>`s (now built by
    `orderCategoriesByTree()` in the new `lib/category-tree.ts`, a depth-
    indented flat list of any depth, shared by Stage Manager and the Atomic
    Vault's product editor).
    - **Creating categories at any depth** (e.g. Audio → Home Audio → LG) is
      now possible from two places: Stage Manager's "Categories" section
      ("+ Add subcategory under X" / delete, with confirm) and directly
      inside a product's category picker in the Atomic Vault ("+ New brand
      under X") — so an admin never has to leave the product form to
      introduce a brand. Both call the same `POST /api/v1/admin/category`.
      Slugs are unique per-business (not per-parent) with collision-suffix
      retry, since e.g. "Samsung" as a brand will legitimately want to exist
      under more than one subcategory.
      Deleting a category is safe by construction: `categories.parent_id`
      cascades and `products.category_id` is `ON DELETE SET NULL`, so
      removing a brand never errors or orphans a product — it just
      un-categorizes it.
    - Verified live end-to-end: created "LG" under Audio → Home Audio through
      the real Stage Manager UI, confirmed the 3-level parent chain via SQL,
      then assigned a real product to it from the Atomic Vault's picker and
      confirmed that too, before cleaning up the test data.
    - **Known gap, not built:** the mega-menu's hover flyout panel still only
      *displays* two levels (brands don't get their own flyout column) — the
      data now supports it, but redesigning the flyout for a 3rd visual tier
      is its own follow-up. Brands are still fully reachable today via a
      category's existing subcategory-pill row on its own page.
  - **Inline visual editor — "click the live site to edit it" (added
    2026-07-10):** the user's own scoping decision on a much larger
    "Visual Architect" brief (full Hostinger/Gutenberg-style JSON-driven
    drag-and-drop builder with an Observer Architecture, Contextual HUD,
    alignment engine, and undo/redo) — offered as two options, and the
    smaller one was explicitly chosen: inline editing of *existing* fields
    through the *existing* API routes/data model, not a new `layout_json`
    schema or block renderer. What shipped:
    - **`ZenithEditable`** (`components/site/ZenithEditable.tsx`) — a
      storefront-side wrapper that, only when rendered inside the admin's
      live-preview iframe (signaled by a `?__zenith_edit=1` query param real
      visitors never carry), draws a small hover pencil button pinned to a
      content element's corner rather than making the content itself
      clickable — deliberate, so it never hijacks clicks on nested
      `<Link>`s. Clicking it `postMessage`s an edit request to
      `window.parent`.
    - **`EditHud`** (`components/admin/EditHud.tsx`) — lives in the parent
      admin page (Stage Manager), listens for that `postMessage` (origin-
      checked), and shows a floating panel (text/textarea/gradient/image
      input depending on field) whose Apply button `PATCH`es the *same*
      `/api/v1/admin/theme` (business scope) or `/api/v1/admin/category`
      (category scope) routes the sidebar forms already used — a new entry
      point onto existing infrastructure, not a new one.
    - Wired into `Stage.tsx`'s kicker/headline/background-gradient/image —
      home page uses business scope, every category page uses category
      scope (`heroKicker`/`heroHeadline`/`heroBg`/`heroImageUrl`, matching
      the existing Stage Manager fields one-for-one).
    - **Home/Shop preview switcher + category-linked preview:** Stage
      Manager's live-preview iframe now carries `__zenith_edit=1` always,
      toggles between `/` and `/shop`, and follows whichever category is
      selected in the Categories section — so the pencils are reachable for
      every editable Stage without leaving the sidebar.
    - **Grand Gallery reorder** (`components/admin/FeaturedReorder.tsx`) —
      a `@dnd-kit` sortable list *in the sidebar* (not on the live preview:
      true cross-iframe drag targets aren't something dnd-kit/native drag
      support across a frame boundary), dropping PATCHes every reordered
      category's `featured_rank` in parallel.
    - **Explicitly deferred** (the larger option the user didn't pick):
      no `layout_json`/block schema, no section drag-and-drop/reordering
      beyond the Grand Gallery list, no alignment/flex-grid engine, no
      video backgrounds, no undo/redo or snapshot/"Nuclear Reset", no
      Hostinger-style "N/7 setup" progress checklist or Add-Section
      template gallery, no rich-text/Slate.js editing (plain text/textarea
      only, matching what the underlying fields already store).
    - **Bug caught in code review before testing:** the background-gradient
      pencil was initially wired to render on both business and category
      scope, but `/api/v1/admin/theme` has no `heroBg` field — Apply would
      have returned a false-success `200` while silently changing nothing
      on the home page. Fixed by scoping it to category-only, matching the
      kicker/image pencils.
    - **Verified live end-to-end against the real DB**, both scopes: business-
      scope headline edit via the home page Stage (confirmed in
      `businesses.branding->>'heroHeadline'`), category-scope kicker edit
      via the Televisions category Stage (confirmed in
      `categories.hero_kicker`) — the same `EditHud.apply()` code path
      handles all four Stage fields per scope, so one field per scope
      exercising the mechanism stands in for all four (the route's field
      mapping was also read directly to confirm all four are wired, not
      just the one tested). `featuredRank` reordering verified by PATCHing
      it directly and confirming the DB order (dnd-kit's own pointer-drag
      mechanics were not re-tested — a mature third-party library, and
      synthetic `PointerEvent`s can't fake real browser pointer capture).
      All test data (a throwaway owner account, test field values, test
      rank) was reverted/deleted after verification.
- **Product detail** — variant picker, per-variant price, stock, VAT breakdown.
- **Collections carousel** — reusable scroll-snap carousel (arrows, dots, autoplay).
- **The Grand Gallery (`/shop`)** — a curated, story-first scroll: one Bento
  block per featured category (1 hero product + up to 4 supporting products),
  a sticky scroll-spy sub-nav to jump between them, and a 4-card "Bizrah
  Promise" benefits gallery (delivery, pay-on-delivery, install, warranty) at
  the foot. Deliberately buy-button-free — "Discover"/"Explore" only.
  - Featured categories are data-driven: `categories.is_featured` +
    `featured_rank` (migration `0005`) — flip a flag to add/reorder a block,
    no code change. `getFeaturedCategoriesWithProducts()` in `lib/catalog.ts`.
  - Sections animate in on scroll (Framer Motion `whileInView`); a
    scroll-spy `IntersectionObserver` drives the sticky sub-nav highlight.
    **Simplification:** all featured categories' products are fetched
    together server-side (cheap at 5 categories × 5 products); true
    per-section lazy *fetching* would need a client-side per-block API call —
    worth revisiting if the featured list grows much larger.

### Identity — the "Zenith Gatekeeper" ✅🟡
- **UserMenu** (header) — Radix `DropdownMenu` (a deliberate, justified use of
  Radix here — accessible roving focus/escape/click-outside for a real menu,
  unlike the earlier declined mega-menu case). Guest state: Sign In/Up,
  Register a Product, Order Look Up. Member state: avatar-initials, name,
  My Account, Orders, Favorites, Manage Subscriptions, Rewards, Sign Out.
- **`/sign-in`** — LG-style split-pane: email/password + Google OAuth (real,
  `signInWithOAuth`) left, "Join to enjoy member perks" right. Apple button is
  rendered and visibly disabled ("coming soon") — **no real Apple Sign-In**
  (requires a paid Apple Developer account + Services ID + private key the
  project doesn't have yet). Sign-in/sign-up slide-and-fade via Framer Motion;
  humanized error toasts (`sonner`) instead of raw Supabase error text.
- **`/onboarding`** — first/last name + required Terms/Privacy/18+ checkboxes +
  optional marketing opt-in. Gated per-tenant, not globally: a Google sign-in
  already carries a name from `profiles` (auto-provisioned by the existing
  `on_auth_user_created` trigger), but still lands here until a `customers`
  row links them to **this** business.
- **No new tables** (migration `0007`): reused the schema that was already
  designed for this — `profiles` (global name/avatar, trigger-provisioned) +
  `customers.auth_user_id` (already existed, just made `phone` nullable and
  added `marketing_opt_in`/`terms_accepted_at`). A member's tenant "membership"
  is literally a `customers` row linked to their auth user instead of a bare
  phone number.
- **Middleware** now also refreshes the Supabase auth session cookie
  (standard `@supabase/ssr` pattern), merged with existing tenant-header
  stamping.
- **Rewards, Favorites, Manage Subscriptions, `/account/orders`** — real
  routes, honest "Coming soon" state (`ComingSoon.tsx`), not fake data. Order
  lookup for guests is real (`/order-lookup` — new form page, existing
  `orders/lookup` API).
- **Known gap:** checkout doesn't yet link a signed-in member's order to their
  `customers` row (it still keys by phone from the guest flow) — connecting
  those is follow-up work, not done in this pass.

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
