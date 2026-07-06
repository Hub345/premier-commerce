import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// The service-role client — it BYPASSES Row-Level Security.
// Rule: never import this into a client component, and every query made through
// it must carry an explicit business_id. RLS cannot save you here; the code must.
export function getServiceSupabase() {
  if (!env.SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(env.SUPABASE_URL, env.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
