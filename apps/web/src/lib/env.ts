// Central place to read environment. Public (NEXT_PUBLIC_*) values are safe in
// the browser; the service role key is read only in server-only modules.

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  PLATFORM_ROOT_DOMAIN: process.env.PLATFORM_ROOT_DOMAIN ?? "premier.app",
  DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG ?? "bizrah",
} as const;

export function hasSupabaseEnv(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}
