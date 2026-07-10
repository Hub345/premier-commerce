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
  demoFeaturedCategoriesWithProducts,
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

// The Atomic Vault manages the full catalog — products of every status, with
// their variants. Product already carries everything the table/drawer needs
// (variants hold price/stock/compareAt), so it's just a Product with all
// statuses, not only published ones.
export type AdminProduct = Product;

// Read via the user-scoped (RLS) client on purpose: the `products_member_all`
// policy already lets a business member see every one of their own products
// regardless of status — no service role needed for the read.
export async function getProductsForAdmin(businessId: string): Promise<AdminProduct[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as Record<string, unknown>[]).map(mapProduct);
}

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  heroKicker: string | null;
  heroHeadline: string | null;
  heroBg: string | null;
  heroImageUrl: string | null;
  isFeatured: boolean;
  featuredRank: number | null;
}

// The Stage Manager's category picker — every category (not just featured
// ones), so the admin can tune any category's Stage copy.
export async function getCategoriesForAdmin(businessId: string): Promise<AdminCategoryRow[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("categories")
    .select(
      "id, name, slug, parent_id, hero_kicker, hero_headline, hero_bg, hero_image_url, is_featured, featured_rank",
    )
    .eq("business_id", businessId)
    .order("position", { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    slug: String(c.slug),
    parentId: c.parent_id as string | null,
    heroKicker: c.hero_kicker as string | null,
    heroHeadline: c.hero_headline as string | null,
    heroBg: c.hero_bg as string | null,
    heroImageUrl: c.hero_image_url as string | null,
    isFeatured: Boolean(c.is_featured),
    featuredRank: c.featured_rank as number | null,
  }));
}

export interface FeaturedCategoryBlock {
  category: CategoryRef;
  hero: CategoryHero;
  products: Product[];
}

// The "Grand Gallery" Shop page: one bento block per featured category, in
// curated order. A category becomes a block just by flagging `is_featured`
// on its row — no separate table, no code change per tenant.
export async function getFeaturedCategoriesWithProducts(
  businessId: string,
): Promise<FeaturedCategoryBlock[]> {
  if (!hasSupabaseEnv()) return demoFeaturedCategoriesWithProducts();
  const supabase = await getServerSupabase();

  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug, hero_kicker, hero_headline, hero_bg, hero_image_url, featured_rank")
    .eq("business_id", businessId)
    .eq("is_featured", true)
    .order("featured_rank", { ascending: true });

  const featured = (cats ?? []) as {
    id: string;
    name: string;
    slug: string;
    hero_kicker: string | null;
    hero_headline: string | null;
    hero_bg: string | null;
    hero_image_url: string | null;
    featured_rank: number | null;
  }[];

  if (featured.length === 0) return [];

  const blocks = await Promise.all(
    featured.map(async (c) => {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("business_id", businessId)
        .eq("status", "published")
        .eq("category_id", c.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const products = ((data ?? []) as Record<string, unknown>[]).map(mapProduct);
      return {
        category: { id: c.id, name: c.name, slug: c.slug },
        hero: {
          kicker: c.hero_kicker,
          headline: c.hero_headline,
          bg: c.hero_bg,
          imageUrl: c.hero_image_url,
        },
        products,
      };
    }),
  );

  return blocks.filter((b) => b.products.length > 0);
}
