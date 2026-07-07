import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const schema = z.object({
  categoryId: z.string().uuid(),
  heroKicker: z.string().max(60).optional(),
  heroHeadline: z.string().max(120).optional(),
  heroBg: z.string().max(400).optional(),
});

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
  const { categoryId, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const update: Record<string, unknown> = {};
  if (fields.heroKicker !== undefined) update.hero_kicker = fields.heroKicker;
  if (fields.heroHeadline !== undefined) update.hero_headline = fields.heroHeadline;
  if (fields.heroBg !== undefined) update.hero_bg = fields.heroBg;

  const service = getServiceSupabase();
  const { error } = await service
    .from("categories")
    .update(update)
    .eq("id", categoryId)
    .eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  // Brands nest under an existing category (e.g. a brand under "Smartphones");
  // null creates a new top-level category.
  parentId: z.string().uuid().nullable(),
});

// Creates a category at any depth — the same mechanism whether it's a
// top-level category or a "brand" nested under a subcategory. Slugs only
// need to be unique per business (not per parent), so two different
// subcategories can each have a "Samsung" brand — collision-suffixed here.
export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessAdmin(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { name, parentId } = parsed.data;
  const service = getServiceSupabase();

  if (parentId) {
    const { data: parent } = await service
      .from("categories")
      .select("id")
      .eq("id", parentId)
      .eq("business_id", business.id)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ error: "parent_not_found" }, { status: 404 });
    }
  }

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data: clash } = await service
      .from("categories")
      .select("id")
      .eq("business_id", business.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: siblings } = await service
    .from("categories")
    .select("position")
    .eq("business_id", business.id)
    .is("parent_id", parentId ?? null)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = ((siblings?.[0] as { position: number } | undefined)?.position ?? -1) + 1;

  const { data: created, error } = await service
    .from("categories")
    .insert({ business_id: business.id, parent_id: parentId, slug, name, position: nextPosition })
    .select("id, name, slug, parent_id")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, category: created });
}

const deleteSchema = z.object({ categoryId: z.string().uuid() });

// Safe by construction: categories.parent_id cascades (deleting a brand's
// parent removes the brand too, if ever done), and products.category_id is
// ON DELETE SET NULL — deleting a category never orphans/errors a product,
// it just un-categorizes it.
export async function DELETE(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessAdmin(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const service = getServiceSupabase();
  const { error } = await service
    .from("categories")
    .delete()
    .eq("id", parsed.data.categoryId)
    .eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
