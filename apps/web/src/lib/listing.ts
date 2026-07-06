// Generic, data-driven product listing + faceting.
// Facets are derived from each product's attributes AND its variants' attributes,
// so the available filters adapt to whatever a tenant sells — Bizrah surfaces
// Brand/Storage/Color; a furniture shop would surface Material/Dimensions —
// with no code changes. Pure functions: shared by the SSR page and the API.

import type { Product } from "@premier/protocol";

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facet {
  key: string;
  label: string;
  values: FacetValue[];
  /** How many products carry this key (used for ranking). */
  coverage: number;
}

export type ListingSort = "relevance" | "price_asc" | "price_desc" | "newest";

export interface ListingParams {
  filters: Record<string, string[]>;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort: ListingSort;
  page: number;
  pageSize: number;
}

/** Query params reserved by the listing itself (everything else is a facet). */
export const RESERVED_PARAMS = new Set(["minp", "maxp", "sort", "page", "q"]);

const LABEL_OVERRIDES: Record<string, string> = {
  ram: "RAM",
  cpu: "CPU",
  sku: "SKU",
  mpn: "MPN",
  anc: "ANC",
};

export function humanizeKey(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  const spaced = key.replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** All filterable values a product exposes, keyed by attribute name. */
export function collectValues(product: Product): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const add = (key: string, raw: unknown) => {
    if (raw === null || raw === undefined) return;
    const value = String(raw).trim();
    if (!value) return;
    let set = out.get(key);
    if (!set) {
      set = new Set();
      out.set(key, set);
    }
    set.add(value);
  };
  for (const [key, raw] of Object.entries(product.attributes)) add(key, raw);
  for (const variant of product.variants) {
    for (const [key, raw] of Object.entries(variant.attributes)) add(key, raw);
  }
  return out;
}

// A key becomes a facet only if it looks like a filter: at least two distinct
// values, not too many, and shared by at least two products. This heuristic is
// what keeps the mechanism generic instead of hard-coding "brand"/"model".
export function buildFacets(products: Product[], maxFacets = 6): Facet[] {
  const valueCounts = new Map<string, Map<string, number>>();
  const coverage = new Map<string, number>();

  for (const product of products) {
    const values = collectValues(product);
    for (const [key, set] of values) {
      coverage.set(key, (coverage.get(key) ?? 0) + 1);
      let counts = valueCounts.get(key);
      if (!counts) {
        counts = new Map();
        valueCounts.set(key, counts);
      }
      for (const value of set) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const facets: Facet[] = [];
  for (const [key, counts] of valueCounts) {
    const cover = coverage.get(key) ?? 0;
    if (counts.size < 2 || counts.size > 12 || cover < 2) continue;
    const values = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    facets.push({ key, label: humanizeKey(key), values, coverage: cover });
  }

  facets.sort((a, b) => {
    if (a.key === "brand" && b.key !== "brand") return -1;
    if (b.key === "brand" && a.key !== "brand") return 1;
    return b.coverage - a.coverage || a.label.localeCompare(b.label);
  });
  return facets.slice(0, maxFacets);
}

export function priceBounds(products: Product[]): {
  minCents: number;
  maxCents: number;
} {
  if (products.length === 0) return { minCents: 0, maxCents: 0 };
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    if (p.fromPriceCents < min) min = p.fromPriceCents;
    if (p.fromPriceCents > max) max = p.fromPriceCents;
  }
  return { minCents: min === Infinity ? 0 : min, maxCents: max };
}

function matches(product: Product, params: ListingParams): boolean {
  const price = product.fromPriceCents;
  if (params.minPriceCents !== undefined && price < params.minPriceCents) return false;
  if (params.maxPriceCents !== undefined && price > params.maxPriceCents) return false;

  const keys = Object.keys(params.filters);
  if (keys.length === 0) return true;

  const values = collectValues(product);
  for (const key of keys) {
    const selected = params.filters[key];
    if (!selected || selected.length === 0) continue;
    const set = values.get(key);
    // Values within a facet are OR'd; different facets are AND'd.
    if (!set || !selected.some((s) => set.has(s))) return false;
  }
  return true;
}

function sortProducts(products: Product[], sort: ListingSort): Product[] {
  const arr = [...products];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.fromPriceCents - b.fromPriceCents);
    case "price_desc":
      return arr.sort((a, b) => b.fromPriceCents - a.fromPriceCents);
    case "newest":
      return arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    default:
      return arr;
  }
}

export interface ListingResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export function queryListing(
  products: Product[],
  params: ListingParams,
): ListingResult {
  const filtered = products.filter((p) => matches(p, params));
  const sorted = sortProducts(filtered, params.sort);
  const { pageSize } = params;
  const page = Math.max(1, params.page);
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(sp: RawParams, key: string): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseListingParams(
  sp: RawParams,
  facetKeys: string[],
  pageSize = 12,
): ListingParams {
  const filters: Record<string, string[]> = {};
  for (const key of facetKeys) {
    const raw = readParam(sp, key);
    if (!raw) continue;
    const values = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length) filters[key] = values;
  }

  const minp = readParam(sp, "minp");
  const maxp = readParam(sp, "maxp");
  const sortRaw = readParam(sp, "sort");
  const sort: ListingSort =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "newest"
      ? sortRaw
      : "relevance";
  const pageNum = Number(readParam(sp, "page") ?? "1");

  return {
    filters,
    minPriceCents: minp ? Number(minp) : undefined,
    maxPriceCents: maxp ? Number(maxp) : undefined,
    sort,
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
    pageSize,
  };
}
