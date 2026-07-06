import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { Business } from "@premier/protocol";
import { getServerSupabase } from "@/lib/supabase/server";
import { mapBusiness } from "@/lib/mappers";
import { env, hasSupabaseEnv } from "@/lib/env";
import { demoBusiness } from "@/lib/demo-data";

// The tenant slug the edge middleware resolved from the host.
export const getTenantSlug = cache(async (): Promise<string> => {
  const h = await headers();
  return h.get("x-tenant-slug")?.trim() || env.DEFAULT_TENANT_SLUG;
});

// Resolve the current tenant from the database. Memoized per request so the
// layout, page, and any route handler share a single query. Returns null
// (rather than throwing) when env or data isn't ready, so the UI can guide setup.
export const getCurrentBusiness = cache(async (): Promise<Business | null> => {
  // No database configured → preview mode: serve the built-in Bizrah tenant.
  if (!hasSupabaseEnv()) return demoBusiness;

  const slug = await getTenantSlug();
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    return mapBusiness(data);
  } catch {
    return null;
  }
});
