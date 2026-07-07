import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { ZENITH_DEFAULTS } from "@/lib/zenith-defaults";

export const dynamic = "force-dynamic";

// The "Nuclear Option" — re-applies the Zenith Factory theme. Scoped to
// theme/wording only (branding + benefits); social links and category Stage
// content aren't touched, since resetting someone's Facebook URL or category
// copy isn't "restoring a broken theme."
export async function POST() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessAdmin(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const service = getServiceSupabase();
  const { data: current, error: readErr } = await service
    .from("businesses")
    .select("branding")
    .eq("id", business.id)
    .single();
  if (readErr || !current) {
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }

  const branding = { ...((current as Record<string, unknown>).branding as Record<string, unknown>) };
  branding.accent = ZENITH_DEFAULTS.accent;
  branding.primary = ZENITH_DEFAULTS.primary;
  branding.fontFamily = ZENITH_DEFAULTS.fontFamily;
  branding.tagline = ZENITH_DEFAULTS.tagline;
  branding.heroHeadline = ZENITH_DEFAULTS.heroHeadline;
  branding.heroSubcopy = ZENITH_DEFAULTS.heroSubcopy;

  const { error } = await service
    .from("businesses")
    .update({ branding, benefits: ZENITH_DEFAULTS.benefits })
    .eq("id", business.id);

  if (error) {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
