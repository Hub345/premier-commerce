import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface CallbackItem {
  Name?: string;
  Value?: string | number;
}

// Daraja posts here. It runs unauthenticated (Safaricom → us), so we look the
// payment up by CheckoutRequestID and let settle_payment() apply it exactly once.
export async function POST(request: Request) {
  const daraja = { ResultCode: 0, ResultDesc: "Accepted" };
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const stkCallback = (
    (body?.Body as Record<string, unknown> | undefined)?.stkCallback ?? null
  ) as Record<string, unknown> | null;
  if (!stkCallback) return NextResponse.json(daraja);

  const checkoutId = String(stkCallback.CheckoutRequestID ?? "");
  const resultCode = Number(stkCallback.ResultCode);

  const supabase = getServiceSupabase();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("provider_ref", checkoutId)
    .maybeSingle();
  if (!payment) return NextResponse.json(daraja);
  const paymentId = String((payment as Record<string, unknown>).id);

  if (resultCode === 0) {
    let receipt: string | null = null;
    const meta = stkCallback.CallbackMetadata as { Item?: CallbackItem[] } | undefined;
    for (const item of meta?.Item ?? []) {
      if (item.Name === "MpesaReceiptNumber") receipt = String(item.Value);
    }
    await supabase.rpc("settle_payment", {
      p_payment_id: paymentId,
      p_provider_ref: receipt,
      p_raw: body,
    });
  } else {
    await supabase
      .from("payments")
      .update({ status: "failed", raw_callback: body })
      .eq("id", paymentId);
  }

  return NextResponse.json(daraja);
}
