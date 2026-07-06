# Premier Commerce Platform

A multi-tenant commerce kernel for the Kenyan market. One Postgres database, one
storefront codebase, one (future) admin app — every record keyed by
`business_id`, isolated at the database, settled through M-Pesa.

**Bizrah Electronics is tenant #1.** The platform is built so that tenant #500
requires no re-architecture.

> Full architecture: [`docs/architecture.html`](docs/architecture.html)

## Monorepo layout

```
apps/
  web/                 Next.js storefront + BFF (the v1 API contract)
packages/
  protocol/            The Standard Commerce Protocol — shared TypeScript types
  config/              Shared tsconfig presets
supabase/
  migrations/          Versioned SQL (schema + RLS + seed)
  functions/           Edge functions (M-Pesa stk-push / callback / reconcile)
docs/
  architecture.html    The approved v1 architecture, as a shareable document
```

## Prerequisites

- Node.js >= 20 (this repo uses npm workspaces — no pnpm required)
- [Supabase CLI](https://supabase.com/docs/guides/cli) for local DB + migrations

## Getting started

```bash
npm install

# 1. Start a local Supabase stack and apply migrations + seed
supabase start
npm run db:reset           # applies migrations/0001_init.sql then seeds Bizrah

# 2. Configure the web app
cp .env.example apps/web/.env.local   # then fill in the Supabase keys

# 3. Run the storefront
npm run dev
```

Visit `http://localhost:3000`. With `DEFAULT_TENANT_SLUG=bizrah`, the landing
page resolves the Bizrah tenant and renders its branding live from the database.

## Architectural rules (non-negotiable)

1. **The client never sends `business_id`.** It is derived from the request host,
   server-side, in `apps/web/middleware.ts`.
2. **RLS guards the client path; server code guards the privileged path.** Any
   service-role code (callbacks, stock writes) must carry and check `business_id`.
3. **Money is integer cents, everywhere.** Never a float.
4. **Prices are recomputed server-side at checkout.** Client totals are untrusted.
5. **Search is behind `SearchProvider`.** Swapping Postgres FTS for Meilisearch or
   Algolia touches one adapter, never the frontend.
