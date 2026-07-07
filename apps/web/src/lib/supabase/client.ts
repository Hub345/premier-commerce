import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseEnv } from "@/lib/env";

// True only when the NEXT_PUBLIC_SUPABASE_* vars are present in the client
// bundle. In preview/demo mode (no Supabase) this is false — auth actions
// must check it before touching the client, since createBrowserClient throws
// on empty credentials.
export const isAuthAvailable = hasSupabaseEnv;

// The browser-side client — used only by client components for auth actions
// (sign in/up/out, OAuth). All data reads/writes still go through the
// server (route handlers), never straight from this client. Callers MUST
// gate on isAuthAvailable() first.
export function getBrowserSupabase() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
