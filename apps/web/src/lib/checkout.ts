import "server-only";
import type { Business, Order } from "@premier/protocol";
import { splitInclusiveVat } from "@premier/protocol";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { mapOrder } from "@/lib/orders";

export interface CheckoutItemInput {
  variantId: string;
  quantity: number;
}

export interface CheckoutCustomerInput {
  phone: string;
  name?: string;
  email?: string;
}

// A domain error whose message is safe to show the customer.
export class CheckoutError extends Error {}

type Row = Record<string, unknown>;

// Creates an order under the service role. business_id is stamped from the
// resolved tenant (never the client). Every line is repriced from the DB, so a
// tampered client price is ignored. Stock is NOT decremented here — that happens
// atomically at payment settlement (see settle_payment()).
export async function createOrder(
  business: Business,
  items: CheckoutItemInput[],
  customer: CheckoutCustomerInput,
): Promise<Order> {
  if (items.length === 0) throw new CheckoutError("Your cart is empty.");
  const supabase = getServiceSupabase();

  const variantIds = items.map((i) => i.variantId);
  const { data: variantRows, error: vErr } = await supabase
    .from("product_variants")
    .select("id, price_cents, label, stock, products(name, status)")
    .eq("business_id", business.id)
    .in("id", variantIds);
  if (vErr) throw new CheckoutError("Could not load your items.");

  const byId = new Map<string, Row>(
    (variantRows ?? []).map((v) => [String((v as Row).id), v as Row]),
  );

  let grossCents = 0;
  const lines = items.map((item) => {
    const v = byId.get(item.variantId);
    if (!v) throw new CheckoutError("An item in your cart is unavailable.");
    const product = (v.products ?? {}) as Row;
    if (product.status !== "published") {
      throw new CheckoutError("An item in your cart is no longer available.");
    }
    const qty = Math.max(1, Math.floor(item.quantity));
    if (num(v.stock) < qty) {
      throw new CheckoutError(`Insufficient stock for ${String(product.name ?? "an item")}.`);
    }
    const unit = num(v.price_cents);
    const lineTotal = unit * qty;
    grossCents += lineTotal;
    return {
      variant_id: v.id,
      name_snapshot: String(product.name ?? "Item"),
      variant_label: (v.label as string | null) ?? null,
      unit_price_cents: unit,
      quantity: qty,
      line_total_cents: lineTotal,
    };
  });

  const vat = business.vat.enabled
    ? splitInclusiveVat(grossCents, business.vat.rate)
    : null;
  const vatCents = vat ? vat.vatCents : 0;
  const netCents = grossCents - vatCents;

  const { data: cust, error: cErr } = await supabase
    .from("customers")
    .upsert(
      {
        business_id: business.id,
        phone: customer.phone,
        name: customer.name ?? null,
        email: customer.email ?? null,
      },
      { onConflict: "business_id,phone" },
    )
    .select("id")
    .single();
  if (cErr || !cust) throw new CheckoutError("Could not save your details.");

  const { data: orderRow, error: oErr } = await supabase
    .from("orders")
    .insert({
      business_id: business.id,
      customer_id: (cust as Row).id,
      status: "pending",
      subtotal_cents: netCents,
      vat_cents: vatCents,
      total_cents: grossCents,
      currency: business.currency,
    })
    .select("id")
    .single();
  if (oErr || !orderRow) throw new CheckoutError("Could not create your order.");

  const orderId = String((orderRow as Row).id);
  const { error: iErr } = await supabase
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: orderId })));
  if (iErr) throw new CheckoutError("Could not save your order items.");

  const { data: full } = await supabase
    .from("orders")
    .select("*, order_items(*), customers(*)")
    .eq("id", orderId)
    .single();
  return mapOrder((full ?? {}) as Row);
}

function num(v: unknown): number {
  return Number(v ?? 0);
}
