import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { getOrderByReference } from "@/lib/orders";

export const dynamic = "force-dynamic";

// GET /api/v1/orders/lookup?reference=BZR-XXXX&phone=2547... — guest tracking.
export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? "";
  const phone = url.searchParams.get("phone") ?? "";
  if (!reference || !phone) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const order = await getOrderByReference(business, reference, phone);
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
