import "server-only";
import type { SearchProvider } from "@premier/protocol";
import { getServerSupabase } from "@/lib/supabase/server";
import { PostgresSearchProvider } from "@/lib/search/postgres-provider";
import { hasSupabaseEnv } from "@/lib/env";
import { demoSearchProvider } from "@/lib/demo-data";

// The single place that decides which search backend is live.
// To migrate to Meilisearch/Algolia later, return that provider here — every
// caller depends only on the SearchProvider interface, not the implementation.
export async function getSearchProvider(): Promise<SearchProvider> {
  if (!hasSupabaseEnv()) return demoSearchProvider;
  const supabase = await getServerSupabase();
  return new PostgresSearchProvider(supabase);
}
