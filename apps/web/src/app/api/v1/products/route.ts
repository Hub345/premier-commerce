import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { listPublishedProducts, getCategoryWithProducts } from "@/lib/catalog";
import {
  buildFacets,
  parseListingParams,
  priceBounds,
  queryListing,
} from "@/lib/listing";

export const dynamic = "force-dynamic";

// GET /api/v1/products?category=phones&brand=Samsung,Apple&minp=..&sort=price_asc&page=1
// Tenant-scoped. Returns products + total + the available facets (with counts),
// so any consumer (web, Flutter, AI) can render a data-driven filter UI.
export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category");

  const products = categorySlug
    ? (await getCategoryWithProducts(business.id, categorySlug)).products
    : await listPublishedProducts(business.id, { limit: 500 });

  const facets = buildFacets(products);
  const params = parseListingParams(url.searchParams, facets.map((f) => f.key));
  const { items, total, page, pageSize } = queryListing(products, params);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    facets,
    priceBounds: priceBounds(products),
  });
}
