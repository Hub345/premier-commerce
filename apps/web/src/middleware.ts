import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const slug = resolveSlug(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", slug);
  requestHeaders.set("x-tenant-host", host);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
