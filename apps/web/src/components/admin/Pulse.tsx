"use client";

import type { ReactNode } from "react";
import { formatMoney } from "@premier/protocol";
import type { CurrencyCode } from "@premier/protocol";
import type { OrderStatus, PulseMetrics } from "@/lib/pulse";

const STATUS_STYLE: Record<OrderStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  paid: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  fulfilled: { label: "Fulfilled", dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
  cancelled: { label: "Cancelled", dot: "bg-zinc-400", text: "text-zinc-500" },
  refunded: { label: "Refunded", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
};

export function Pulse({ metrics, currency }: { metrics: PulseMetrics; currency: CurrencyCode }) {
  const money = (cents: number) => formatMoney(cents, currency);
  const { sales, inventory, catalog, customers } = metrics;
  const hasOrders = sales.orderCount > 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
            Archetype 01
          </p>
          <h1 className="text-lg font-semibold">Pulse</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live signals
        </span>
      </div>

      {/* KPI row — real data across the board. Revenue reads zero honestly
          until the first order settles; inventory & customers are live now. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
        <Stat label="Revenue · 30d" value={money(sales.last30PaidCents)} sub={`${money(sales.paidCents)} all-time`} />
        <Stat
          label="Orders"
          value={sales.orderCount.toLocaleString()}
          sub={`${sales.paidOrderCount.toLocaleString()} paid`}
        />
        <Stat label="Avg order" value={sales.paidOrderCount > 0 ? money(sales.avgOrderCents) : "—"} sub="per paid order" />
        <Stat
          label="Inventory value"
          value={money(inventory.retailValueCents)}
          sub={`${inventory.totalUnits.toLocaleString()} units`}
        />
        <Stat
          label="Customers"
          value={customers.total.toLocaleString()}
          sub={`${customers.withAccount.toLocaleString()} with account`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales trend — spans 2 cols */}
        <Card title="Realized revenue · 14 days" className="lg:col-span-2">
          {hasOrders && sales.paidCents > 0 ? (
            <>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{money(sales.last30PaidCents)}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">last 30 days</span>
              </div>
              <Sparkline points={metrics.trend.map((t) => t.cents)} />
            </>
          ) : (
            <Empty
              icon="chart"
              title="No sales yet"
              body="This chart fills in the moment your first M-Pesa order settles. Everything is wired — it just needs a real order to plot."
            />
          )}
        </Card>

        {/* Orders by status */}
        <Card title="Orders by status">
          {hasOrders ? (
            <ul className="space-y-2.5">
              {metrics.ordersByStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[s.status].dot}`} />
                    <span className="text-zinc-600 dark:text-zinc-300">{STATUS_STYLE[s.status].label}</span>
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="orders" title="No orders yet" body="Order flow appears here once checkout runs live." />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent orders */}
        <Card title="Recent orders">
          {metrics.recentOrders.length > 0 ? (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {metrics.recentOrders.map((o) => (
                <li key={o.reference} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">{o.reference}</p>
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{o.customerName ?? "Guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(o.totalCents)}</p>
                    <p className={`text-[11px] ${STATUS_STYLE[o.status].text}`}>{STATUS_STYLE[o.status].label}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="orders" title="No orders yet" body="Your live order feed shows up here." />
          )}
        </Card>

        {/* Low-stock watchlist — real, actionable today */}
        <Card
          title="Low-stock watchlist"
          badge={
            inventory.lowStockCount + inventory.outOfStockCount > 0 ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                {inventory.outOfStockCount} out · {inventory.lowStockCount} low
              </span>
            ) : null
          }
        >
          {inventory.lowStock.length > 0 ? (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {inventory.lowStock.map((v, i) => (
                <li key={`${v.name}-${v.label}-${i}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{v.name}</p>
                    {v.label ? (
                      <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{v.label}</p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] ${
                      v.stock === 0
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                    }`}
                  >
                    {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="check" title="Stock looks healthy" body="Every variant is above the low-stock threshold." />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <Card title="Top products · by revenue">
          {metrics.topProducts.length > 0 ? (
            <ul className="space-y-2.5">
              {metrics.topProducts.map((p, i) => (
                <li key={`${p.name}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">{i + 1}</span>
                    <span className="truncate text-zinc-700 dark:text-zinc-200">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-semibold">{money(p.revenueCents)}</span>
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">{p.units} sold</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="chart" title="No best-sellers yet" body="Once orders land, your top earners rank here." />
          )}
        </Card>

        {/* Catalog snapshot — real */}
        <Card title="Catalog">
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Published" value={catalog.published} accent="text-emerald-600 dark:text-emerald-400" />
            <Mini label="Draft" value={catalog.draft} accent="text-amber-600 dark:text-amber-400" />
            <Mini label="Archived" value={catalog.archived} accent="text-zinc-500" />
            <Mini label="Variants" value={catalog.variantCount} accent="text-zinc-700 dark:text-zinc-200" />
          </div>
        </Card>
      </div>

      {/* Honest scope note: what Pulse deliberately doesn't cover yet. */}
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Pulse reflects real orders, inventory, and customers. Traffic &amp; audience signals — visitors, sources, and
        geography — arrive in a later phase; they need a dedicated event pipeline, so they&rsquo;re intentionally not
        shown here rather than estimated.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{sub}</p> : null}
    </div>
  );
}

function Card({
  title,
  badge,
  className,
  children,
}: {
  title: string;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white/60 p-5 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40 ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{title}</h2>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-zinc-100/70 p-3 dark:bg-zinc-950/50">
      <p className={`text-2xl font-semibold tracking-tight ${accent}`}>{value.toLocaleString()}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
    </div>
  );
}

function Empty({ icon, title, body }: { icon: "chart" | "orders" | "check"; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="mb-2 text-zinc-300 dark:text-zinc-700">{ICONS[icon]}</span>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-500">{body}</p>
    </div>
  );
}

const ICONS: Record<"chart" | "orders" | "check", ReactNode> = {
  chart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18M7 15l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  orders: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2l1.5 3M18 2l-1.5 3M3 6h18l-1.5 12a2 2 0 01-2 2H6.5a2 2 0 01-2-2L3 6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Sparkline({ points }: { points: number[] }) {
  const W = 100;
  const H = 32;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? W / (points.length - 1) : W;
  const coords = points.map((v, i) => [i * step, H - (v / max) * (H - 4) - 2] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W.toFixed(1)},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full text-emerald-500">
      <path d={area} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
