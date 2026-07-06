import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { createOrder, CheckoutError } from "@/lib/checkout";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  customer: z.object({
    phone: z.string().min(9).max(15),
    name: z.string().max(120).optional(),
    email: z.string().email().optional(),
  }),
});

// POST /api/v1/checkout — tenant derived from host; prices recomputed server-side.
export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "demo_mode" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const order = await createOrder(
      business,
      parsed.data.items,
      parsed.data.customer,
    );
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
