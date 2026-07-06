import { NextResponse } from "next/server";
import type { Paginated, Product } from "@premier/protocol";
import { getCurrentBusiness } from "@/lib/tenant";
import { listPublishedProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// GET /api/v1/catalog/products?limit=24
// Always tenant-scoped: the business is derived from the host, never the query.
export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 24, 100);
  const items = await listPublishedProducts(business.id, { limit });

  const body: Paginated<Product> = {
    items,
    total: items.length,
    page: 1,
    pageSize: limit,
  };
  return NextResponse.json(body);
}
