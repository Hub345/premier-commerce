// Preview fallback data. Used ONLY when no Supabase env is configured, so the
// storefront renders the full Bizrah experience with `npm run dev` and no
// database. Mirrors supabase/migrations/0002 + 0003. Never used when a real DB
// is connected — every accessor is gated on hasSupabaseEnv() at the call site.

import type {
  Business,
  Product,
  ProductVariant,
  SearchProvider,
  SearchResult,
} from "@premier/protocol";
import type { NavNode } from "@/lib/nav-types";
import { ZENITH_DEFAULTS } from "@/lib/zenith-defaults";

export const demoBusiness: Business = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "bizrah",
  name: "Bizrah Electronics",
  currency: "KES",
  branding: {
    logoUrl: null,
    faviconUrl: null,
    accent: ZENITH_DEFAULTS.accent,
    primary: ZENITH_DEFAULTS.primary,
    fontFamily: ZENITH_DEFAULTS.fontFamily,
    tagline: ZENITH_DEFAULTS.tagline,
    heroHeadline: ZENITH_DEFAULTS.heroHeadline,
    heroSubcopy: ZENITH_DEFAULTS.heroSubcopy,
  },
  contact: {
    phone: "+254700123456",
    email: "support@bizrah.co.ke",
    facebookUrl: "https://facebook.com/bizrahelectronics",
    instagramUrl: "https://instagram.com/bizrahelectronics",
    youtubeUrl: null,
    xUrl: null,
  },
  benefits: ZENITH_DEFAULTS.benefits,
  vat: { enabled: true, rate: 0.16, registrationNumber: "P051234567X" },
  status: "active",
};

export const demoNavTree: NavNode[] = [
  {
    id: "phones",
    name: "Phones & Tablets",
    slug: "phones",
    children: [
      { id: "smartphones", name: "Smartphones", slug: "smartphones", children: [] },
      { id: "tablets", name: "Tablets", slug: "tablets", children: [] },
      { id: "wearables", name: "Wearables", slug: "wearables", children: [] },
      { id: "phone-accessories", name: "Phone Accessories", slug: "phone-accessories", children: [] },
    ],
  },
  {
    id: "televisions",
    name: "Televisions",
    slug: "televisions",
    children: [
      { id: "oled-tvs", name: "OLED TVs", slug: "oled-tvs", children: [] },
      { id: "qled-led-tvs", name: "QLED & LED TVs", slug: "qled-led-tvs", children: [] },
      { id: "tv-shop-by-size", name: "Shop by Size", slug: "tv-shop-by-size", children: [] },
      { id: "projectors", name: "Projectors", slug: "projectors", children: [] },
      { id: "tv-accessories", name: "TV Accessories", slug: "tv-accessories", children: [] },
    ],
  },
  {
    id: "computers",
    name: "Computers",
    slug: "computers",
    children: [
      { id: "laptops", name: "Laptops", slug: "laptops", children: [] },
      { id: "desktops", name: "Desktops", slug: "desktops", children: [] },
      { id: "monitors", name: "Monitors", slug: "monitors", children: [] },
      { id: "computer-accessories", name: "Computer Accessories", slug: "computer-accessories", children: [] },
    ],
  },
  {
    id: "audio",
    name: "Audio",
    slug: "audio",
    children: [
      { id: "headphones", name: "Headphones", slug: "headphones", children: [] },
      { id: "wireless-earbuds", name: "Wireless Earbuds", slug: "wireless-earbuds", children: [] },
      { id: "speakers", name: "Speakers", slug: "speakers", children: [] },
      { id: "home-audio", name: "Home Audio", slug: "home-audio", children: [] },
    ],
  },
  {
    id: "appliances",
    name: "Home Appliances",
    slug: "appliances",
    children: [
      { id: "refrigerators", name: "Refrigerators", slug: "refrigerators", children: [] },
      { id: "washing-machines", name: "Washing Machines", slug: "washing-machines", children: [] },
      { id: "cooking", name: "Cooking", slug: "cooking", children: [] },
      { id: "air-treatment", name: "Air Treatment", slug: "air-treatment", children: [] },
    ],
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    children: [
      { id: "chargers-cables", name: "Chargers & Cables", slug: "chargers-cables", children: [] },
      { id: "power-banks", name: "Power Banks", slug: "power-banks", children: [] },
      { id: "cases-covers", name: "Cases & Covers", slug: "cases-covers", children: [] },
      { id: "storage-memory", name: "Storage & Memory", slug: "storage-memory", children: [] },
    ],
  },
];

interface VariantSpec {
  label: string;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  attrs?: Record<string, string | number | boolean>;
}

function makeProduct(
  slug: string,
  name: string,
  description: string,
  brand: string,
  variantSpecs: VariantSpec[],
): Product {
  const variants: ProductVariant[] = variantSpecs.map((s, i) => ({
    id: `${slug}-v${i}`,
    sku: null,
    label: s.label,
    priceCents: s.priceCents,
    compareAtCents: s.compareAtCents ?? null,
    stock: s.stock,
    attributes: s.attrs ?? {},
    images: [],
    isDefault: i === 0,
  }));
  return {
    id: slug,
    slug,
    name,
    description,
    categoryId: null,
    status: "published",
    attributes: { brand },
    images: [],
    variants,
    fromPriceCents: Math.min(...variants.map((v) => v.priceCents)),
    createdAt: "2026-07-01T00:00:00Z",
  };
}

interface DemoEntry {
  product: Product;
  categoryTop: string;
}

const ENTRIES: DemoEntry[] = [
  {
    categoryTop: "phones",
    product: makeProduct(
      "samsung-galaxy-a55-5g",
      "Samsung Galaxy A55 5G",
      "A premium mid-range 5G phone with a 6.6\" Super AMOLED 120Hz display, 50MP OIS camera and all-day battery.",
      "Samsung",
      [
        { label: "128GB / 8GB · Navy", priceCents: 5299900, compareAtCents: 5699900, stock: 24, attrs: { storage: "128GB", ram: "8GB", color: "Navy" } },
        { label: "256GB / 8GB · Navy", priceCents: 5999900, stock: 12, attrs: { storage: "256GB", ram: "8GB", color: "Navy" } },
      ],
    ),
  },
  {
    categoryTop: "phones",
    product: makeProduct(
      "apple-iphone-15",
      "Apple iPhone 15",
      "The iPhone 15 with Dynamic Island, a 48MP main camera and USB-C.",
      "Apple",
      [
        { label: "128GB · Blue", priceCents: 11499900, stock: 15, attrs: { storage: "128GB", color: "Blue" } },
        { label: "256GB · Blue", priceCents: 12999900, stock: 9, attrs: { storage: "256GB", color: "Blue" } },
      ],
    ),
  },
  {
    categoryTop: "phones",
    product: makeProduct(
      "tecno-camon-30",
      "Tecno Camon 30",
      "Big display, big battery and a 50MP camera at a value price.",
      "Tecno",
      [{ label: "256GB / 8GB", priceCents: 2899900, compareAtCents: 3199900, stock: 40, attrs: { storage: "256GB", ram: "8GB" } }],
    ),
  },
  {
    categoryTop: "televisions",
    product: makeProduct(
      "samsung-55-crystal-uhd",
      "Samsung 55\" Crystal UHD 4K",
      "Crystal Processor 4K upscaling, HDR and a slim design. Smart TV powered by Tizen.",
      "Samsung",
      [{ label: "55\" Crystal UHD", priceCents: 6299900, compareAtCents: 6999900, stock: 8, attrs: { size: "55\"" } }],
    ),
  },
  {
    categoryTop: "televisions",
    product: makeProduct(
      "lg-65-oled-evo",
      "LG 65\" OLED evo C4",
      "Self-lit OLED pixels for perfect blacks, α9 AI Processor and 144Hz gaming.",
      "LG",
      [{ label: "65\" OLED evo C4", priceCents: 18999900, stock: 4, attrs: { size: "65\"" } }],
    ),
  },
  {
    categoryTop: "computers",
    product: makeProduct(
      "apple-macbook-air-m3",
      "Apple MacBook Air 13\" (M3)",
      "The M3 chip brings serious performance and up to 18 hours of battery in a fanless design.",
      "Apple",
      [
        { label: "M3 · 8GB / 256GB · Midnight", priceCents: 16499900, stock: 10, attrs: { ram: "8GB", storage: "256GB", color: "Midnight" } },
        { label: "M3 · 16GB / 512GB · Midnight", priceCents: 21499900, stock: 6, attrs: { ram: "16GB", storage: "512GB", color: "Midnight" } },
      ],
    ),
  },
  {
    categoryTop: "computers",
    product: makeProduct(
      "hp-pavilion-15",
      "HP Pavilion 15",
      "A dependable everyday laptop: 13th-gen Intel Core i5, 8GB RAM and a fast 512GB SSD.",
      "HP",
      [{ label: "Core i5 · 8GB / 512GB", priceCents: 7999900, compareAtCents: 8499900, stock: 14, attrs: { ram: "8GB", storage: "512GB", color: "Silver" } }],
    ),
  },
  {
    categoryTop: "audio",
    product: makeProduct(
      "sony-wh-1000xm5",
      "Sony WH-1000XM5 Headphones",
      "Industry-leading noise cancellation, 30-hour battery and crystal-clear calling.",
      "Sony",
      [
        { label: "Black", priceCents: 4499900, stock: 22, attrs: { color: "Black" } },
        { label: "Silver", priceCents: 4499900, stock: 18, attrs: { color: "Silver" } },
      ],
    ),
  },
  {
    categoryTop: "accessories",
    product: makeProduct(
      "anker-usb-c-charger-20w",
      "Anker 20W USB-C Charger",
      "Compact PIQ 3.0 fast charger. Fills a compatible phone to 50% in around 25 minutes.",
      "Anker",
      [{ label: "20W USB-C", priceCents: 249900, compareAtCents: 299900, stock: 120, attrs: { color: "White" } }],
    ),
  },
  {
    categoryTop: "appliances",
    product: makeProduct(
      "ramtons-2door-fridge",
      "Ramtons 2-Door Fridge 213L",
      "Frost-free 213L double-door refrigerator with a large vegetable crisper.",
      "Ramtons",
      [{ label: "213L · Silver", priceCents: 5499900, compareAtCents: 5999900, stock: 7, attrs: { color: "Silver", capacity: "213L" } }],
    ),
  },
];

export const demoProducts: Product[] = ENTRIES.map((e) => e.product);

export function demoListProducts(limit = 24): Product[] {
  return demoProducts.slice(0, limit);
}

export function demoProductBySlug(slug: string): Product | null {
  return demoProducts.find((p) => p.slug === slug) ?? null;
}

function topSlugFor(slug: string): { top: string; name: string } | null {
  for (const node of demoNavTree) {
    if (node.slug === slug) return { top: node.slug, name: node.name };
    for (const child of node.children) {
      if (child.slug === slug) return { top: node.slug, name: child.name };
    }
  }
  return null;
}

export function demoProductsInCategory(slug: string): {
  category: { id: string; name: string; slug: string } | null;
  products: Product[];
} {
  const match = topSlugFor(slug);
  if (!match) return { category: null, products: [] };
  const products = ENTRIES.filter((e) => e.categoryTop === match.top).map(
    (e) => e.product,
  );
  return { category: { id: slug, name: match.name, slug }, products };
}

const CATEGORY_HERO: Record<
  string,
  { kicker: string; headline: string; bg: string }
> = {
  phones: { kicker: "Phones & Tablets", headline: "Power in your pocket.", bg: "linear-gradient(160deg,#F6F1EA,#FBF9F5)" },
  televisions: { kicker: "Televisions", headline: "Cinema-grade clarity.", bg: "linear-gradient(160deg,#E7EFF3,#F6FAFB)" },
  computers: { kicker: "Computers", headline: "Built to perform.", bg: "linear-gradient(160deg,#EDEEE8,#FAFAF6)" },
  audio: { kicker: "Audio", headline: "Hear everything.", bg: "linear-gradient(160deg,#EFEBF3,#FAF8FC)" },
  appliances: { kicker: "Home Appliances", headline: "Your home, upgraded.", bg: "linear-gradient(160deg,#E8F1EC,#F6FBF8)" },
  accessories: { kicker: "Accessories", headline: "The finishing touch.", bg: "linear-gradient(160deg,#F4EEE7,#FBF8F4)" },
};

interface DemoHero {
  kicker: string | null;
  headline: string | null;
  bg: string | null;
  imageUrl: string | null;
}

function heroFor(slug: string, name: string): DemoHero {
  const h = CATEGORY_HERO[slug];
  return {
    kicker: h?.kicker ?? name,
    headline: h?.headline ?? name,
    bg: h?.bg ?? null,
    imageUrl: null,
  };
}

export function demoCategoryWithProducts(slug: string): {
  category: { id: string; name: string; slug: string } | null;
  trail: { name: string; slug: string }[];
  subcategories: { name: string; slug: string }[];
  hero: DemoHero | null;
  products: Product[];
} {
  for (const top of demoNavTree) {
    if (top.slug === slug) {
      return {
        category: { id: top.id, name: top.name, slug: top.slug },
        trail: [{ name: top.name, slug: top.slug }],
        subcategories: top.children.map((c) => ({ name: c.name, slug: c.slug })),
        hero: heroFor(top.slug, top.name),
        products: demoProductsInCategory(slug).products,
      };
    }
    const child = top.children.find((c) => c.slug === slug);
    if (child) {
      return {
        category: { id: child.id, name: child.name, slug: child.slug },
        trail: [
          { name: top.name, slug: top.slug },
          { name: child.name, slug: child.slug },
        ],
        subcategories: [],
        hero: heroFor(child.slug, child.name),
        products: demoProductsInCategory(slug).products,
      };
    }
  }
  return { category: null, trail: [], subcategories: [], hero: null, products: [] };
}

// Gallery order for the "/shop" Grand Gallery — mirrors migration 0005's
// featured_rank seed for Bizrah.
const FEATURED_ORDER = ["televisions", "phones", "computers", "audio", "appliances"];

export interface FeaturedCategoryBlock {
  category: { id: string; name: string; slug: string };
  hero: DemoHero;
  products: Product[];
}

export function demoFeaturedCategoriesWithProducts(): FeaturedCategoryBlock[] {
  return FEATURED_ORDER.map((slug) => {
    const top = demoNavTree.find((n) => n.slug === slug);
    if (!top) return null;
    return {
      category: { id: top.id, name: top.name, slug: top.slug },
      hero: heroFor(top.slug, top.name),
      products: demoProductsInCategory(slug).products,
    };
  }).filter((b): b is FeaturedCategoryBlock => b !== null);
}

export const demoSearchProvider: SearchProvider = {
  name: "demo",
  async query(req): Promise<SearchResult> {
    const term = req.term.trim().toLowerCase();
    const items = term
      ? demoProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              String(p.attributes.brand ?? "").toLowerCase().includes(term),
          )
          .map((product) => ({ product, score: 1 }))
      : [];
    return { items, total: items.length, page: 1, pageSize: 24, term: req.term };
  },
  async index() {},
  async remove() {},
};
