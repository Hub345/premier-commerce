import Link from "next/link";
import { getCurrentBusiness } from "@/lib/tenant";
import { getNavigationTree } from "@/lib/nav";
import { MegaMenu } from "@/components/site/MegaMenu";
import { SearchTrigger } from "@/components/site/SearchTrigger";
import { CartWidget } from "@/components/site/CartWidget";

export async function SiteHeader() {
  const business = await getCurrentBusiness();
  const tree = business ? await getNavigationTree(business.id) : [];
  const name = business?.name ?? "Premier";

  return (
    <header className="sticky top-0 z-30">
      {/* Announcement strip (LG-style) */}
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-2 text-center text-xs">
          Free delivery over KSh 5,000 &middot; Genuine warranty &middot; 14-day returns
        </div>
      </div>

      <div className="border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-base font-semibold tracking-tight">{name}</span>
          </Link>

          <div className="flex flex-1 justify-center">
            <MegaMenu tree={tree} />
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <SearchTrigger />
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.4" />
                <path d="M5.5 20a6.5 6.5 0 0113 0" strokeLinecap="round" />
              </svg>
            </span>
            <CartWidget />
          </div>
        </div>
      </div>
    </header>
  );
}
