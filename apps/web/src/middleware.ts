import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env, hasSupabaseEnv } from "@/lib/env";

// Tenant resolution happens once, at the edge. The client never sends a
// business id — it is derived here from the request host and stamped into a
// header the server trusts.

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "premier.app";
const DEFAULT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? "bizrah";

function resolveSlug(host: string): string {
  const hostname = (host.split(":")[0] ?? "").toLowerCase();

  // Local dev and preview hosts carry no tenant subdomain.
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".vercel.app") ||
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}`
  ) {
    return DEFAULT_SLUG;
  }

  // e.g. "bizrah.premier.app" -> "bizrah"
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.slice(0, hostname.length - (ROOT_DOMAIN.length + 1));
    const label = sub.split(".")[0];
    if (label) return label;
  }

  // Otherwise it is a custom domain; the server resolves it via x-tenant-host.
  return DEFAULT_SLUG;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const slug = resolveSlug(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", slug);
  requestHeaders.set("x-tenant-host", host);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!hasSupabaseEnv()) return response;

  // A guest browsing the storefront carries no Supabase auth cookie at all —
  // there is no session to refresh, so skip the network round-trip to
  // Supabase Auth entirely. This is the majority of traffic on a storefront,
  // and getUser() here was previously running (and blocking the response)
  // on every single request, signed-in or not.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (!hasAuthCookie) return response;

  // Refresh the Supabase auth session cookie on every request — the standard
  // @supabase/ssr middleware pattern, merged with tenant header stamping.
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
