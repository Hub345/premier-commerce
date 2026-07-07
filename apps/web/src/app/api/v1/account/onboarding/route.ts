import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  marketingOptIn: z.boolean(),
  // Only required the first time (no customers row yet) — see below.
  ageConfirmed: z.boolean().optional(),
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
});

type Row = Record<string, unknown>;

export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const supabase = await getServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const input = parsed.data;
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const service = getServiceSupabase();
  const { data: existing } = await service
    .from("customers")
    .select("id")
    .eq("business_id", business.id)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // First time joining this business: consent is mandatory.
  if (!existing) {
    if (!input.ageConfirmed || !input.termsAccepted || !input.privacyAccepted) {
      return NextResponse.json({ error: "consent_required" }, { status: 400 });
    }
  }

  // profiles row always exists already (auto-provisioned on sign-up).
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);

  if (existing) {
    await service
      .from("customers")
      .update({ name: fullName, marketing_opt_in: input.marketingOptIn })
      .eq("id", (existing as Row).id as string);
  } else {
    await service.from("customers").insert({
      business_id: business.id,
      auth_user_id: user.id,
      name: fullName,
      email: user.email,
      marketing_opt_in: input.marketingOptIn,
      terms_accepted_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
