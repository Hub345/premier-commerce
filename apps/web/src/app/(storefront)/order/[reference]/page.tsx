import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getOrderByReference } from "@/lib/orders";
import { formatMoney } from "@premier/protocol";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { reference } = await params;
  const { phone } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) notFound();

  if (!phone) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Order {reference}</h1>
        <p className="mt-3 text-ink-soft">
          Open this page from your confirmation link, which includes your phone
          number, to view the order.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium"
        >
          Back to store
        </Link>
      </main>
    );
  }

  const order = await getOrderByReference(business, reference, phone);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
        Order
      </p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{order.reference}</h1>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--accent)", color: "#161613" }}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-soft">
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="block font-medium">{item.nameSnapshot}</span>
                {item.variantLabel ? (
                  <span className="text-ink-muted">{item.variantLabel}</span>
                ) : null}
                <span className="text-ink-muted"> · ×{item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium">
                {formatMoney(item.lineTotalCents, order.currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal (excl. VAT)</dt>
            <dd>{formatMoney(order.subtotalCents, order.currency)}</dd>
          </div>
          {order.vatCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">VAT</dt>
              <dd>{formatMoney(order.vatCents, order.currency)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between pt-1 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatMoney(order.totalCents, order.currency)}</dd>
          </div>
        </dl>
      </div>

      <Link
        href="/"
        className="mt-8 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
        style={{ background: "var(--primary)" }}
      >
        Continue shopping
      </Link>
    </main>
  );
}
