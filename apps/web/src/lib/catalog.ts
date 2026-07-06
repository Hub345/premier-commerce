import "server-only";
import type { Product } from "@premier/protocol";
import { getServerSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/mappers";
import { hasSupabaseEnv } from "@/lib/env";
import {
  demoListProducts,
  demoProductBySlug,
  demoProductsInCategory,
  demoCategoryWithProducts,
} from "@/lib/demo-data";

// Nested select pulls each product with its variants in one round trip.
const PRODUCT_SELECT = "*, product_variants(*)";

export async function listPublishedProducts(
  businessId: string,
  opts: { limit?: number } = {},
): Promise<Product[]> {
  if (!hasSupabaseEnv()) return demoListProducts(opts.limit ?? 24);
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("business_id", businessId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 24);

  if (error || !data) return [];
  return data.map((row) => mapProduct(row as Record<string, unknown>));
}

export async function getProductBySlug(
  businessId: string,
  slug: string,
): Promise<Product | null> {
  if (!hasSupabaseEnv()) return demoProductBySlug(slug);
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("business_id", businessId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data as Record<string, unknown>);
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

// List products in a category *and all its descendants*, so a top-level
// category page shows everything beneath it, not just directly-tagged items.
export async function listProductsInCategory(
  businessId: string,
  slug: string,
  limit = 48,
): Promise<{ category: CategoryRef | null; products: Product[] }> {
  if (!hasSupabaseEnv()) return demoProductsInCategory(slug);
  const supabase = await getServerSupabase();

  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("business_id", businessId);

  const all = (cats ?? []) as {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
  }[];

  const target = all.find((c) => c.slug === slug) ?? null;
  if (!target) return { category: null, products: [] };

  const ids = new Set<string>([target.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of all) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("business_id", businessId)
    .eq("status", "published")
    .in("category_id", [...ids])
    .order("created_at", { ascending: false })
    .limit(limit);

  const products = ((data ?? []) as Record<string, unknown>[]).map(mapProduct);
  return {
    category: { id: target.id, name: target.name, slug: target.slug },
    products,
  };
}

export interface CategoryTrailItem {
  name: string;
  slug: string;
}

export interface CategoryHero {
  kicker: string | null;
  headline: string | null;
  bg: string | null;
  imageUrl: string | null;
}

export interface CategoryListing {
  category: CategoryRef | null;
  trail: CategoryTrailItem[];
  subcategories: CategoryTrailItem[];
  hero: CategoryHero | null;
  products: Product[];
}

// Everything the Product Listing Page needs: the category, its breadcrumb
// trail (walked up the parent chain), and all published products beneath it.
export async function getCategoryWithProducts(
  businessId: string,
  slug: string,
): Promise<CategoryListing> {
  if (!hasSupabaseEnv()) return demoCategoryWithProducts(slug);
  const supabase = await getServerSupabase();

  const { data: cats } = await supabase
    .from("categories")
    .select(
      "id, name, slug, parent_id, hero_kicker, hero_headline, hero_bg, hero_image_url",
    )
    .eq("business_id", businessId);

  const all = (cats ?? []) as {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    hero_kicker: string | null;
    hero_headline: string | null;
    hero_bg: string | null;
    hero_image_url: string | null;
  }[];

  const target = all.find((c) => c.slug === slug) ?? null;
  if (!target) {
    return { category: null, trail: [], subcategories: [], hero: null, products: [] };
  }

  // Descendant categories (so a top-level page shows everything under it).
  const ids = new Set<string>([target.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of all) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }

  // Breadcrumb trail: walk up from the target to the root.
  const byId = new Map(all.map((c) => [c.id, c]));
  const trail: CategoryTrailItem[] = [];
  let cursor: (typeof all)[number] | undefined = target;
  while (cursor) {
    trail.unshift({ name: cursor.name, slug: cursor.slug });
    cursor = cursor.parent_id ? byId.get(cursor.parent_id) : undefined;
  }

  const subcategories = all
    .filter((c) => c.parent_id === target.id)
    .map((c) => ({ name: c.name, slug: c.slug }));
  const hero: CategoryHero = {
    kicker: target.hero_kicker,
    headline: target.hero_headline,
    bg: target.hero_bg,
    imageUrl: target.hero_image_url,
  };

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("business_id", businessId)
    .eq("status", "published")
    .in("category_id", [...ids])
    .order("created_at", { ascending: false })
    .limit(500);

  const products = ((data ?? []) as Record<string, unknown>[]).map(mapProduct);
  return {
    category: { id: target.id, name: target.name, slug: target.slug },
    trail,
    subcategories,
    hero,
    products,
  };
}
