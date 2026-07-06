import "server-only";
import type { Business, Order, OrderItem } from "@premier/protocol";
import { getServiceSupabase } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => (typeof v === "string" ? v : null);

export function mapOrder(row: Row): Order {
  const itemRows = (row.order_items ?? []) as Row[];
  const items: OrderItem[] = itemRows.map((it) => ({
    id: String(it.id),
    variantId: str(it.variant_id),
    nameSnapshot: String(it.name_snapshot),
    variantLabel: str(it.variant_label),
    unitPriceCents: num(it.unit_price_cents),
    quantity: num(it.quantity),
    lineTotalCents: num(it.line_total_cents),
  }));
  const cust = (row.customers ?? null) as Row | null;
  return {
    id: String(row.id),
    reference: String(row.reference),
    status: row.status as Order["status"],
    customer: cust
      ? {
          id: String(cust.id),
          phone: String(cust.phone),
          name: str(cust.name),
          email: str(cust.email),
        }
      : null,
    items,
    subtotalCents: num(row.subtotal_cents),
    vatCents: num(row.vat_cents),
    totalCents: num(row.total_cents),
    currency: row.currency === "USD" ? "USD" : "KES",
    createdAt: String(row.created_at ?? ""),
  };
}

// Guest order lookup: reference + phone, no account required.
export async function getOrderByReference(
  business: Business,
  reference: string,
  phone: string,
): Promise<Order | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), customers(*)")
    .eq("business_id", business.id)
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as Row;
  const cust = row.customers as Row | null;
  if (!cust || String(cust.phone) !== phone) return null;
  return mapOrder(row);
}
