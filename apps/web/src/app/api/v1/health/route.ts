import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// Tenant-aware health check. Confirms the host resolved to a business.
export async function GET() {
  const business = await getCurrentBusiness();
  return NextResponse.json({
    ok: true,
    service: "premier-commerce",
    version: "v1",
    tenant: business ? { slug: business.slug, name: business.name } : null,
  });
}
