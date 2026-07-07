import Link from "next/link";
import { getCurrentBusiness } from "@/lib/tenant";
import { getNavigationTree } from "@/lib/nav";
import { getCurrentMember } from "@/lib/auth";
import { MegaMenu } from "@/components/site/MegaMenu";
import { SearchTrigger } from "@/components/site/SearchTrigger";
import { CartWidget } from "@/components/site/CartWidget";
import { UserMenu } from "@/components/site/UserMenu";

export async function SiteHeader() {
  const business = await getCurrentBusiness();
  // Nav tree and member lookup both only need business.id and don't depend on
  // each other — run them concurrently instead of two sequential round trips.
  const [tree, member] = business
    ? await Promise.all([getNavigationTree(business.id), getCurrentMember(business.id)])
    : [[], null];
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
            <UserMenu member={member ? { fullName: member.fullName, email: member.email } : null} />
            <CartWidget />
          </div>
        </div>
      </div>
    </header>
  );
}
