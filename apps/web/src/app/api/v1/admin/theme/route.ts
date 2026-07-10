import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const url = z.string().url().or(z.literal(""));

const schema = z.object({
  accent: hex.optional(),
  primary: hex.optional(),
  fontFamily: z.enum(["geist", "inter", "playfair"]).optional(),
  tagline: z.string().max(200).optional(),
  heroHeadline: z.string().max(120).optional(),
  heroSubcopy: z.string().max(400).optional(),
  heroBgMediaUrl: url.nullable().optional(),
  facebookUrl: url.optional(),
  instagramUrl: url.optional(),
  youtubeUrl: url.optional(),
  xUrl: url.optional(),
  benefits: z.array(z.object({ title: z.string().max(60), copy: z.string().max(240) })).max(8).optional(),
});

type Row = Record<string, unknown>;

export async function PATCH(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessAdmin(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const input = parsed.data;

  const service = getServiceSupabase();
  const { data: current, error: readErr } = await service
    .from("businesses")
    .select("branding, contact")
    .eq("id", business.id)
    .single();
  if (readErr || !current) {
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }

  const branding = { ...((current as Row).branding as Row) };
  const contact = { ...((current as Row).contact as Row) };

  const brandingKeys = ["accent", "primary", "fontFamily", "tagline", "heroHeadline", "heroSubcopy"] as const;
  for (const key of brandingKeys) {
    if (input[key] !== undefined) branding[key] = input[key];
  }
  // Background media: empty string (a "remove background" click) stores null.
  if (input.heroBgMediaUrl !== undefined) {
    branding.heroBgMediaUrl = input.heroBgMediaUrl === "" ? null : input.heroBgMediaUrl;
  }
  const contactKeys = ["facebookUrl", "instagramUrl", "youtubeUrl", "xUrl"] as const;
  for (const key of contactKeys) {
    if (input[key] !== undefined) contact[key] = input[key] === "" ? null : input[key];
  }

  const update: Row = { branding, contact };
  if (input.benefits) update.benefits = input.benefits;

  const { error: writeErr } = await service.from("businesses").update(update).eq("id", business.id);
  if (writeErr) {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
