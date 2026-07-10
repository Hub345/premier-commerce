import "server-only";
import { hasSupabaseEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase/admin";

// Pulse — "Glass Cockpit" (Archetype 01). The vital signs of a store, built
// entirely from data the platform already records: real orders, real
// inventory, real customers. Nothing here is synthesized — when a number is
// zero it's because that thing genuinely hasn't happened yet (e.g. no orders
// until M-Pesa goes live), and the dashboard says so honestly rather than
// inventing traffic. Web-analytics (visitors, sources, geo) would need a
// separate event-ingestion pipeline that doesn't exist yet — deliberately
// out of scope, flagged in the UI as the next phase.

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

// A sale counts as realized revenue once it's paid (or fulfilled, which
// implies paid). Pending/cancelled/refunded never count toward revenue.
const REALIZED: OrderStatus[] = ["paid", "fulfilled"];
const LOW_STOCK_THRESHOLD = 5;
const TREND_DAYS = 14;
const RECENT_LIMIT = 8;

export interface PulseMetrics {
  sales: {
    grossCents: number;
    paidCents: number;
    last30PaidCents: number;
    orderCount: number;
    paidOrderCount: number;
    avgOrderCents: number;
  };
  ordersByStatus: { status: OrderStatus; count: number }[];
  /** Realized revenue per day for the last TREND_DAYS, oldest → newest. */
  trend: { date: string; cents: number }[];
  recentOrders: {
    reference: string;
    status: OrderStatus;
    totalCents: number;
    createdAt: string;
    customerName: string | null;
  }[];
  topProducts: { name: string; units: number; revenueCents: number }[];
  customers: { total: number; withAccount: number; last30: number };
  inventory: {
    totalUnits: number;
    retailValueCents: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStock: { name: string; label: string | null; stock: number }[];
  };
  catalog: { total: number; published: number; draft: number; archived: number; variantCount: number };
}

const ALL_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"];

function emptyMetrics(): PulseMetrics {
  return {
    sales: {
      grossCents: 0,
      paidCents: 0,
      last30PaidCents: 0,
      orderCount: 0,
      paidOrderCount: 0,
      avgOrderCents: 0,
    },
    ordersByStatus: ALL_STATUSES.map((status) => ({ status, count: 0 })),
    trend: buildEmptyTrend(),
    recentOrders: [],
    topProducts: [],
    customers: { total: 0, withAccount: 0, last30: 0 },
    inventory: { totalUnits: 0, retailValueCents: 0, lowStockCount: 0, outOfStockCount: 0, lowStock: [] },
    catalog: { total: 0, published: 0, draft: 0, archived: 0, variantCount: 0 },
  };
}

function dayKey(d: Date): string {
  // Local-day bucket (YYYY-MM-DD) so "today" lines up with the admin's clock.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildEmptyTrend(): { date: string; cents: number }[] {
  const out: { date: string; cents: number }[] = [];
  const now = new Date();
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({ date: dayKey(d), cents: 0 });
  }
  return out;
}

type OrderRow = {
  reference: string;
  status: OrderStatus;
  total_cents: number | string;
  created_at: string;
  customers: { name: string | null } | { name: string | null }[] | null;
};

export async function getPulseMetrics(businessId: string): Promise<PulseMetrics> {
  // Admin requires a real session (Supabase), so this only runs with env
  // configured; the guard keeps types honest and the no-env preview safe.
  if (!hasSupabaseEnv()) return emptyMetrics();

  const supabase = getServiceSupabase();

  // Service-role reads, every one manually scoped by business_id (order_items
  // has no business_id column of its own, so it's scoped via an inner join on
  // its order). Bounded fetch of recent orders is fine at MVP volume; move the
  // aggregates to a SQL view/materialized rollup when order count grows large.
  const [ordersRes, itemsRes, customersRes, productsRes, variantsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("reference, status, total_cents, created_at, customers(name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("order_items")
      .select("name_snapshot, quantity, line_total_cents, orders!inner(business_id, status)")
      .eq("orders.business_id", businessId)
      .in("orders.status", REALIZED)
      .limit(5000),
    supabase.from("customers").select("auth_user_id, created_at").eq("business_id", businessId),
    supabase.from("products").select("status").eq("business_id", businessId),
    supabase.from("product_variants").select("label, stock, price_cents, products(name)").eq("business_id", businessId),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const items = (itemsRes.data ?? []) as Record<string, unknown>[];
  const customers = (customersRes.data ?? []) as Record<string, unknown>[];
  const products = (productsRes.data ?? []) as Record<string, unknown>[];
  const variants = (variantsRes.data ?? []) as Record<string, unknown>[];

  const now = new Date();
  const thirtyAgo = new Date(now);
  thirtyAgo.setDate(now.getDate() - 30);

  // ── Sales ──────────────────────────────────────────────────────────────
  const statusCounts = new Map<OrderStatus, number>(ALL_STATUSES.map((s) => [s, 0]));
  const trendMap = new Map<string, number>(buildEmptyTrend().map((t) => [t.date, 0]));
  let grossCents = 0;
  let paidCents = 0;
  let last30PaidCents = 0;
  let paidOrderCount = 0;

  for (const o of orders) {
    const total = Number(o.total_cents) || 0;
    const status = o.status;
    grossCents += total;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    if (REALIZED.includes(status)) {
      paidCents += total;
      paidOrderCount += 1;
      const created = new Date(o.created_at);
      if (created >= thirtyAgo) last30PaidCents += total;
      const key = dayKey(created);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + total);
    }
  }

  const recentOrders = orders.slice(0, RECENT_LIMIT).map((o) => {
    // Supabase embeds a to-one relation as an object, but the generated types
    // sometimes widen it to an array — normalize either shape.
    const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    return {
      reference: o.reference,
      status: o.status,
      totalCents: Number(o.total_cents) || 0,
      createdAt: o.created_at,
      customerName: c?.name ?? null,
    };
  });

  // ── Top products (from realized order items) ───────────────────────────
  const productAgg = new Map<string, { units: number; revenueCents: number }>();
  for (const it of items) {
    const name = String(it.name_snapshot ?? "Unknown");
    const units = Number(it.quantity) || 0;
    const rev = Number(it.line_total_cents) || 0;
    const cur = productAgg.get(name) ?? { units: 0, revenueCents: 0 };
    cur.units += units;
    cur.revenueCents += rev;
    productAgg.set(name, cur);
  }
  const topProducts = [...productAgg.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  // ── Customers ──────────────────────────────────────────────────────────
  let withAccount = 0;
  let customersLast30 = 0;
  for (const c of customers) {
    if (c.auth_user_id) withAccount += 1;
    if (c.created_at && new Date(String(c.created_at)) >= thirtyAgo) customersLast30 += 1;
  }

  // ── Inventory ──────────────────────────────────────────────────────────
  let totalUnits = 0;
  let retailValueCents = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const lowStock: { name: string; label: string | null; stock: number }[] = [];
  for (const v of variants) {
    const stock = Number(v.stock) || 0;
    const price = Number(v.price_cents) || 0;
    totalUnits += stock;
    retailValueCents += stock * price;
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    const name = String((prod as { name?: string } | null)?.name ?? "Unknown");
    if (stock === 0) {
      outOfStockCount += 1;
      lowStock.push({ name, label: (v.label as string | null) ?? null, stock });
    } else if (stock <= LOW_STOCK_THRESHOLD) {
      lowStockCount += 1;
      lowStock.push({ name, label: (v.label as string | null) ?? null, stock });
    }
  }
  lowStock.sort((a, b) => a.stock - b.stock);

  // ── Catalog ────────────────────────────────────────────────────────────
  let published = 0;
  let draft = 0;
  let archived = 0;
  for (const p of products) {
    const s = String(p.status);
    if (s === "published") published += 1;
    else if (s === "draft") draft += 1;
    else if (s === "archived") archived += 1;
  }

  return {
    sales: {
      grossCents,
      paidCents,
      last30PaidCents,
      orderCount: orders.length,
      paidOrderCount,
      avgOrderCents: paidOrderCount > 0 ? Math.round(paidCents / paidOrderCount) : 0,
    },
    ordersByStatus: ALL_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
    trend: buildEmptyTrend().map((t) => ({ date: t.date, cents: trendMap.get(t.date) ?? 0 })),
    recentOrders,
    topProducts,
    customers: { total: customers.length, withAccount, last30: customersLast30 },
    inventory: {
      totalUnits,
      retailValueCents,
      lowStockCount,
      outOfStockCount,
      lowStock: lowStock.slice(0, 8),
    },
    catalog: { total: products.length, published, draft, archived, variantCount: variants.length },
  };
}
