import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { loadMpesaConfig, isMpesaReady } from "@/lib/mpesa/config";
import { stkPush, normalizePhone } from "@/lib/mpesa/client";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().uuid(),
  phone: z.string().min(9).max(15),
});

type Row = Record<string, unknown>;

export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { orderId, phone } = parsed.data;

  const supabase = getServiceSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, business_id, reference, total_cents, status")
    .eq("id", orderId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  const o = order as Row;
  if (o.status === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }

  const cfg = await loadMpesaConfig(business.id);
  if (!isMpesaReady(cfg)) {
    return NextResponse.json({ error: "mpesa_not_configured" }, { status: 400 });
  }

  const amountCents = Number(o.total_cents);
  // Record intent before anything leaves the building.
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .insert({
      business_id: business.id,
      order_id: orderId,
      provider: "mpesa",
      status: "initiated",
      amount_cents: amountCents,
      idempotency_key: `stk:${orderId}:${Date.now()}`,
    })
    .select("id")
    .single();
  if (pErr || !payment) {
    return NextResponse.json({ error: "payment_init_failed" }, { status: 500 });
  }
  const paymentId = String((payment as Row).id);

  const base = process.env.MPESA_CALLBACK_BASE_URL || new URL(request.url).origin;
  const callbackUrl = `${base}/api/v1/payments/mpesa/callback`;

  const result = await stkPush(cfg, {
    amountKes: amountCents / 100,
    phone: normalizePhone(phone),
    accountRef: String(o.reference ?? "ORDER"),
    description: `Order ${String(o.reference ?? "")}`,
    callbackUrl,
  });

  if (!result.ok) {
    await supabase
      .from("payments")
      .update({ status: "failed", raw_callback: { error: result.message } })
      .eq("id", paymentId);
    return NextResponse.json(
      { error: "stk_push_failed", message: result.message },
      { status: 502 },
    );
  }

  await supabase
    .from("payments")
    .update({ status: "pending", provider_ref: result.checkoutRequestId })
    .eq("id", paymentId);

  return NextResponse.json({ checkoutRequestId: result.checkoutRequestId });
}
