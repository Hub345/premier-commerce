import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";
import { getSearchProvider } from "@/lib/search";

export const dynamic = "force-dynamic";

// GET /api/v1/catalog/search?q=phone
export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  const term = new URL(request.url).searchParams.get("q") ?? "";
  const provider = await getSearchProvider();
  const result = await provider.query({ businessId: business.id, term });

  return NextResponse.json(result);
}
