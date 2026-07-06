import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { loadMpesaConfig, isMpesaReady } from "@/lib/mpesa/config";
import { stkQuery } from "@/lib/mpesa/client";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

// GET /api/v1/payments/status?orderId=... — the reconciliation poll.
export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "missing_orderId" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, provider_ref")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let orderStatus = String((order as Row).status);
  const p = (payment ?? null) as Row | null;

  // If still pending, actively ask Daraja — this covers the case where the
  // callback never arrived. settle_payment() is idempotent either way.
  if (p && p.status === "pending" && p.provider_ref) {
    const cfg = await loadMpesaConfig(business.id);
    if (isMpesaReady(cfg)) {
      try {
        const q = await stkQuery(cfg, String(p.provider_ref));
        if (q.paid) {
          await supabase.rpc("settle_payment", {
            p_payment_id: String(p.id),
            p_provider_ref: null,
            p_raw: { source: "reconcile" },
          });
          orderStatus = "paid";
        }
      } catch {
        // Transient — the client will poll again.
      }
    }
  }

  return NextResponse.json({
    orderStatus,
    paymentStatus: p ? String(p.status) : null,
  });
}
