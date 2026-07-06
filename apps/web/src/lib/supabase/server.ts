import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// The user-scoped client. Honors the logged-in session (or anonymous), so
// Row-Level Security applies to every query made through it.
export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options });
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh is handled in route handlers / middleware.
        }
      },
    },
  });
}
