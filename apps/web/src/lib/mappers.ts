// Translate snake_case database rows into the camelCase protocol types.
// One direction, in one place, so the wire shape stays stable.

import type { Business, Product, ProductVariant } from "@premier/protocol";

type Row = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export function mapBusiness(row: Row): Business {
  const branding = (row.branding ?? {}) as Row;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    currency: row.currency === "USD" ? "USD" : "KES",
    branding: {
      logoUrl: str(branding.logoUrl),
      faviconUrl: str(branding.faviconUrl),
      accent: str(branding.accent),
      primary: str(branding.primary),
      tagline: str(branding.tagline),
      heroHeadline: str(branding.heroHeadline),
      heroSubcopy: str(branding.heroSubcopy),
    },
    vat: {
      enabled: Boolean(row.vat_enabled),
      rate: Number(row.vat_rate ?? 0),
      registrationNumber: str(row.vat_reg_no),
    },
    status: row.status === "suspended" ? "suspended" : "active",
  };
}

export function mapVariant(row: Row): ProductVariant {
  return {
    id: String(row.id),
    sku: str(row.sku),
    label: str(row.label),
    priceCents: Number(row.price_cents),
    compareAtCents: row.compare_at_cents == null ? null : Number(row.compare_at_cents),
    stock: Number(row.stock ?? 0),
    attributes: (row.attributes ?? {}) as ProductVariant["attributes"],
    images: (row.images ?? []) as string[],
    isDefault: Boolean(row.is_default),
  };
}

export function mapProduct(row: Row): Product {
  const rawVariants = (row.product_variants ?? row.variants ?? []) as Row[];
  const variants = rawVariants.map(mapVariant);
  const prices = variants.map((v) => v.priceCents);

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: str(row.description),
    categoryId: str(row.category_id),
    status: (row.status as Product["status"]) ?? "draft",
    attributes: (row.attributes ?? {}) as Product["attributes"],
    images: (row.images ?? []) as string[],
    variants,
    fromPriceCents: prices.length ? Math.min(...prices) : 0,
    createdAt: String(row.created_at ?? ""),
  };
}
