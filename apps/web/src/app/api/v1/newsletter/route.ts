import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Preview mode (no Supabase configured) — accept the submission gracefully
  // without a database to write to.
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from("newsletter_subscribers").upsert(
    { business_id: business.id, email: parsed.data.email },
    { onConflict: "business_id,email", ignoreDuplicates: true },
  );

  if (error) {
    return NextResponse.json({ error: "subscribe_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
