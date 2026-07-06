-- ════════════════════════════════════════════════════════════════════════
-- Premier Commerce Platform — 0001 init
-- Multi-tenant core. Every row belongs to exactly one business.
-- Isolation is enforced at the database via RLS; the privileged (service-role)
-- path is guarded in application code.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()
create extension if not exists pg_trgm;     -- fuzzy name matching
create extension if not exists unaccent;    -- accent-insensitive search

-- ─── Enums ──────────────────────────────────────────────────────────────

create type member_role      as enum ('owner', 'manager', 'staff');
create type business_status   as enum ('active', 'suspended');
create type product_status    as enum ('draft', 'published', 'archived');
create type order_status       as enum ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');
create type payment_provider  as enum ('mpesa', 'stripe');
create type payment_status    as enum ('initiated', 'pending', 'paid', 'failed', 'cancelled');
create type inventory_reason  as enum ('sale', 'restock', 'adjustment', 'correction', 'return');

-- ─── Utility functions ──────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Membership check used inside RLS policies. SECURITY DEFINER so it can read
-- business_members without triggering that table's own RLS recursively.
create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from business_members m
    where m.business_id = p_business_id
      and m.profile_id = auth.uid()
  );
$$;

-- ─── Tenancy ────────────────────────────────────────────────────────────

create table businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  custom_domain text unique,
  name          text not null,
  ref_prefix    text not null default 'ORD',
  currency      text not null default 'KES',
  branding      jsonb not null default '{}'::jsonb,
  vat_enabled   boolean not null default false,
  vat_rate      numeric(5,4) not null default 0.1600,
  vat_reg_no    text,
  status        business_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table business_members (
  business_id uuid not null references businesses(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  role        member_role not null default 'staff',
  created_at  timestamptz not null default now(),
  primary key (business_id, profile_id)
);

-- Per-tenant payment credentials. Secrets must be encrypted at rest (pgsodium /
-- Vault) before production — never exposed to any client. RLS denies all
-- non-service roles; only server code with the service role reads this table.
create table business_payment_configs (
  business_id         uuid primary key references businesses(id) on delete cascade,
  provider            payment_provider not null default 'mpesa',
  environment         text not null default 'sandbox',
  mpesa_shortcode     text,
  mpesa_passkey       text,
  mpesa_consumer_key  text,
  mpesa_consumer_secret text,
  callback_url        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Catalog ────────────────────────────────────────────────────────────

create table categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  parent_id   uuid references categories(id) on delete set null,
  slug        text not null,
  name        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, slug)
);

create table products (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  slug        text not null,
  name        text not null,
  description text,
  status      product_status not null default 'draft',
  attributes  jsonb not null default '{}'::jsonb,
  images      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, slug)
);

-- Generated full-text vector: name (A) > brand (B) > description (C).
-- 'simple' config keeps product names and brands language-agnostic.
alter table products
  add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(attributes->>'brand', '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored;

create table product_variants (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  product_id     uuid not null references products(id) on delete cascade,
  sku            text,
  label          text,
  price_cents    bigint not null check (price_cents >= 0),
  compare_at_cents bigint check (compare_at_cents >= 0),
  stock          integer not null default 0,
  attributes     jsonb not null default '{}'::jsonb,
  images         text[] not null default '{}',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── Commerce ───────────────────────────────────────────────────────────

create table customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  phone        text not null,
  name         text,
  email        text,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (business_id, phone)
);

create table orders (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  customer_id    uuid references customers(id) on delete set null,
  reference      text not null,
  status         order_status not null default 'pending',
  channel        text not null default 'web',
  subtotal_cents bigint not null default 0,
  vat_cents      bigint not null default 0,
  total_cents    bigint not null default 0,
  currency       text not null default 'KES',
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, reference)
);

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  variant_id       uuid references product_variants(id) on delete set null,
  name_snapshot    text not null,
  variant_label    text,
  unit_price_cents bigint not null,
  quantity         integer not null check (quantity > 0),
  line_total_cents bigint not null
);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  order_id        uuid not null references orders(id) on delete cascade,
  provider        payment_provider not null default 'mpesa',
  status          payment_status not null default 'initiated',
  amount_cents    bigint not null,
  idempotency_key text not null unique,
  provider_ref    text,
  raw_callback    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Append-only inventory ledger. Every stock movement is recorded.
create table inventory_logs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  variant_id  uuid not null references product_variants(id) on delete cascade,
  delta       integer not null,
  reason      inventory_reason not null,
  ref         text,
  created_at  timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────

create index categories_business_idx      on categories (business_id);
create index products_business_status_idx on products (business_id, status);
create index products_category_idx        on products (category_id);
create index products_search_idx          on products using gin (search_tsv);
create index products_name_trgm_idx       on products using gin (name gin_trgm_ops);
create index variants_product_idx         on product_variants (product_id);
create index variants_business_idx        on product_variants (business_id);
create index customers_business_phone_idx on customers (business_id, phone);
create index orders_business_status_idx   on orders (business_id, status);
create index order_items_order_idx        on order_items (order_id);
create index payments_order_idx           on payments (order_id);
create index inventory_business_variant_idx on inventory_logs (business_id, variant_id);

-- ─── Triggers ───────────────────────────────────────────────────────────

create trigger businesses_updated_at   before update on businesses         for each row execute function set_updated_at();
create trigger profiles_updated_at     before update on profiles           for each row execute function set_updated_at();
create trigger paycfg_updated_at       before update on business_payment_configs for each row execute function set_updated_at();
create trigger categories_updated_at   before update on categories         for each row execute function set_updated_at();
create trigger products_updated_at     before update on products           for each row execute function set_updated_at();
create trigger variants_updated_at     before update on product_variants   for each row execute function set_updated_at();
create trigger customers_updated_at    before update on customers          for each row execute function set_updated_at();
create trigger orders_updated_at       before update on orders             for each row execute function set_updated_at();
create trigger payments_updated_at     before update on payments           for each row execute function set_updated_at();

-- Auto-provision a profile row when a new auth user signs up (Google, etc.).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generate a human-friendly order reference (e.g. "BZR-A1B2C3D") if absent.
create or replace function public.set_order_reference()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference :=
      coalesce((select ref_prefix from businesses where id = new.business_id), 'ORD')
      || '-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 7));
  end if;
  return new;
end;
$$;

create trigger orders_set_reference
  before insert on orders
  for each row execute function public.set_order_reference();

-- ─── Business logic: idempotent payment settlement ──────────────────────
-- Applies a payment exactly once. Marks it paid, decrements variant stock
-- under row locks (no oversell), writes the inventory ledger, and flips the
-- order to paid. Re-invocation for an already-paid payment is a no-op.
create or replace function public.settle_payment(
  p_payment_id  uuid,
  p_provider_ref text,
  p_raw          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id  uuid;
  v_business  uuid;
  v_status    payment_status;
  v_item      record;
  v_new_stock integer;
begin
  select order_id, business_id, status
    into v_order_id, v_business, v_status
  from payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'payment % not found', p_payment_id;
  end if;

  if v_status = 'paid' then
    return;  -- already applied; idempotent
  end if;

  update payments
     set status = 'paid',
         provider_ref = coalesce(p_provider_ref, provider_ref),
         raw_callback = p_raw,
         updated_at = now()
   where id = p_payment_id;

  for v_item in
    select variant_id, quantity
    from order_items
    where order_id = v_order_id
      and variant_id is not null
  loop
    update product_variants
       set stock = stock - v_item.quantity,
           updated_at = now()
     where id = v_item.variant_id
    returning stock into v_new_stock;

    if v_new_stock < 0 then
      raise exception 'insufficient stock for variant %', v_item.variant_id
        using errcode = 'check_violation';
    end if;

    insert into inventory_logs (business_id, variant_id, delta, reason, ref)
    values (v_business, v_item.variant_id, -v_item.quantity, 'sale', v_order_id::text);
  end loop;

  update orders
     set status = 'paid', updated_at = now()
   where id = v_order_id;
end;
$$;

-- ─── Search RPC (Postgres FTS provider backs onto this) ─────────────────
create or replace function public.search_products(
  p_business_id uuid,
  p_term        text,
  p_limit       int default 24,
  p_offset      int default 0
)
returns table (product_id uuid, score real)
language sql
stable
set search_path = public
as $$
  select p.id,
         ts_rank(p.search_tsv, websearch_to_tsquery('simple', p_term)) as score
  from products p
  where p.business_id = p_business_id
    and p.status = 'published'
    and (
      coalesce(p_term, '') = ''
      or p.search_tsv @@ websearch_to_tsquery('simple', p_term)
      or p.name ilike '%' || p_term || '%'
    )
  order by score desc, p.created_at desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- ════════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ════════════════════════════════════════════════════════════════════════

alter table businesses              enable row level security;
alter table profiles                enable row level security;
alter table business_members        enable row level security;
alter table business_payment_configs enable row level security;
alter table categories              enable row level security;
alter table products                enable row level security;
alter table product_variants        enable row level security;
alter table customers               enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table payments                enable row level security;
alter table inventory_logs          enable row level security;

-- businesses: branding of active tenants is public; members manage their own.
create policy businesses_public_read on businesses
  for select to anon, authenticated
  using (status = 'active');

create policy businesses_member_update on businesses
  for update to authenticated
  using (is_business_member(id))
  with check (is_business_member(id));

-- profiles: a user sees and edits only their own profile.
create policy profiles_self_read on profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_self_update on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- business_members: visible to members of the same business.
create policy members_read on business_members
  for select to authenticated using (is_business_member(business_id));

-- categories: public reads; members write.
create policy categories_public_read on categories
  for select to anon, authenticated using (true);
create policy categories_member_all on categories
  for all to authenticated
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

-- products: public reads only PUBLISHED; members see and manage all their own.
create policy products_public_read on products
  for select to anon, authenticated using (status = 'published');
create policy products_member_all on products
  for all to authenticated
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

-- variants: public reads only when the parent product is published.
create policy variants_public_read on product_variants
  for select to anon, authenticated
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id and p.status = 'published'
  ));
create policy variants_member_all on product_variants
  for all to authenticated
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

-- customers / orders / order_items / payments / inventory: members only.
-- (Guest checkout writes go through the service role in the BFF, which stamps
--  business_id itself — never trusting the anonymous client.)
create policy customers_member_all on customers
  for all to authenticated
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy orders_member_all on orders
  for all to authenticated
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy order_items_member_all on order_items
  for all to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id and is_business_member(o.business_id)
  ))
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id and is_business_member(o.business_id)
  ));

create policy payments_member_read on payments
  for select to authenticated using (is_business_member(business_id));

create policy inventory_member_read on inventory_logs
  for select to authenticated using (is_business_member(business_id));

-- ─── Grants (RLS still gates every row) ─────────────────────────────────

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- Payment credentials are readable by the service role only.
revoke all on public.business_payment_configs from anon, authenticated;
