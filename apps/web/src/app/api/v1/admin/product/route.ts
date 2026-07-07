import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessAdmin } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const attributesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const variantSchema = z.object({
  // Present = update that row; absent = insert a new one.
  id: z.string().uuid().optional(),
  // true + id = delete that row.
  _delete: z.boolean().optional(),
  label: z.string().max(80).optional(),
  sku: z.string().max(60).nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  compareAtCents: z.number().int().min(0).nullable().optional(),
  attributes: attributesSchema.optional(),
  images: z.array(z.string().url()).optional(),
  isDefault: z.boolean().optional(),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── PATCH: edit an existing product (any subset of fields/variants) ───────

const patchSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  attributes: attributesSchema.optional(),
  images: z.array(z.string().url()).optional(),
  variants: z.array(variantSchema).optional(),
});

export async function PATCH(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessAdmin(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const input = parsed.data;
  const service = getServiceSupabase();

  const productPatch: Record<string, unknown> = {};
  if (input.name !== undefined) productPatch.name = input.name;
  if (input.description !== undefined) productPatch.description = input.description;
  if (input.status !== undefined) productPatch.status = input.status;
  if (input.categoryId !== undefined) productPatch.category_id = input.categoryId;
  if (input.attributes !== undefined) productPatch.attributes = input.attributes;
  if (input.images !== undefined) productPatch.images = input.images;

  if (Object.keys(productPatch).length > 0) {
    const { error } = await service
      .from("products")
      .update(productPatch)
      .eq("id", input.productId)
      .eq("business_id", business.id);
    if (error) return NextResponse.json({ error: "product_write_failed" }, { status: 500 });
  }

  for (const v of input.variants ?? []) {
    if (v._delete && v.id) {
      const { error } = await service
        .from("product_variants")
        .delete()
        .eq("id", v.id)
        .eq("product_id", input.productId)
        .eq("business_id", business.id);
      if (error) return NextResponse.json({ error: "variant_delete_failed" }, { status: 500 });
      continue;
    }

    if (v.id) {
      const variantPatch: Record<string, unknown> = {};
      if (v.label !== undefined) variantPatch.label = v.label;
      if (v.sku !== undefined) variantPatch.sku = v.sku;
      if (v.priceCents !== undefined) variantPatch.price_cents = v.priceCents;
      if (v.stock !== undefined) variantPatch.stock = v.stock;
      if (v.compareAtCents !== undefined) variantPatch.compare_at_cents = v.compareAtCents;
      if (v.attributes !== undefined) variantPatch.attributes = v.attributes;
      if (v.images !== undefined) variantPatch.images = v.images;
      if (v.isDefault !== undefined) variantPatch.is_default = v.isDefault;

      const { error } = await service
        .from("product_variants")
        .update(variantPatch)
        .eq("id", v.id)
        .eq("product_id", input.productId)
        .eq("business_id", business.id);
      if (error) return NextResponse.json({ error: "variant_write_failed" }, { status: 500 });
    } else {
      const { error } = await service.from("product_variants").insert({
        business_id: business.id,
        product_id: input.productId,
        label: v.label ?? null,
        sku: v.sku ?? null,
        price_cents: v.priceCents ?? 0,
        stock: v.stock ?? 0,
        compare_at_cents: v.compareAtCents ?? null,
        attributes: v.attributes ?? {},
        images: v.images ?? [],
        is_default: v.isDefault ?? false,
      });
      if (error) return NextResponse.json({ error: "variant_insert_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

// ─── POST: create a new product with its initial variant(s) ───────────────

const createSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  attributes: attributesSchema.optional(),
  images: z.array(z.string().url()).optional(),
  variants: z
    .array(
      z.object({
        label: z.string().max(80).optional(),
        sku: z.string().max(60).nullable().optional(),
        priceCents: z.number().int().min(0),
        stock: z.number().int().min(0).default(0),
        compareAtCents: z.number().int().min(0).nullable().optional(),
        attributes: attributesSchema.optional(),
        images: z.array(z.string().url()).optional(),
      }),
    )
    .min(1),
});

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
  const input = parsed.data;
  const service = getServiceSupabase();

  const baseSlug = slugify(input.name) || "product";
  let slug = baseSlug;
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data: clash } = await service
      .from("products")
      .select("id")
      .eq("business_id", business.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: product, error: productErr } = await service
    .from("products")
    .insert({
      business_id: business.id,
      category_id: input.categoryId ?? null,
      slug,
      name: input.name,
      description: input.description ?? null,
      status: "draft",
      attributes: input.attributes ?? {},
      images: input.images ?? [],
    })
    .select("id, slug")
    .single();

  if (productErr || !product) {
    return NextResponse.json({ error: "product_create_failed" }, { status: 500 });
  }
  const productId = (product as { id: string }).id;

  const variantRows = input.variants.map((v, i) => ({
    business_id: business.id,
    product_id: productId,
    label: v.label ?? null,
    sku: v.sku ?? null,
    price_cents: v.priceCents,
    stock: v.stock,
    compare_at_cents: v.compareAtCents ?? null,
    attributes: v.attributes ?? {},
    images: v.images ?? [],
    is_default: i === 0,
  }));

  const { error: variantErr } = await service.from("product_variants").insert(variantRows);
  if (variantErr) {
    // Roll back the orphaned product row rather than leaving a variant-less product.
    await service.from("products").delete().eq("id", productId);
    return NextResponse.json({ error: "variant_create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, productId, slug: (product as { slug: string }).slug });
}
