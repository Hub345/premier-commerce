import Link from "next/link";
import { getCurrentBusiness } from "@/lib/tenant";
import { listPublishedProducts } from "@/lib/catalog";
import { getNavigationTree } from "@/lib/nav";
import { ProductCard } from "@/components/ProductCard";
import { Carousel } from "@/components/site/Carousel";
import { Stage } from "@/components/site/Stage";
import type { NavNode } from "@/lib/nav-types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const business = await getCurrentBusiness();
  if (!business) return <SetupNotice />;

  const [products, tree] = await Promise.all([
    listPublishedProducts(business.id, { limit: 8 }),
    getNavigationTree(business.id),
  ]);
  const b = business.branding;

  return (
    <>
      <Stage
        sceneKey="home"
        kicker={business.name}
        headline={b.heroHeadline ?? "Technology worth the upgrade."}
        ctaHref="#featured"
        ctaLabel="Browse the store"
        bg={null}
        imageUrl={null}
        flagship={products[0]?.name ?? null}
      />

      <main className="mx-auto max-w-6xl px-6 py-14">
        {/* Featured */}
        <section id="featured" className="scroll-mt-24">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Featured</h2>
            <span className="font-mono text-xs text-ink-muted">
              {products.length} products
            </span>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No published products yet. Run{" "}
              <code className="font-mono">npm run db:reset</code> to load the
              Bizrah catalog.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} currency={business.currency} />
              ))}
            </div>
          )}
        </section>

        {/* Collections carousel */}
        {tree.length > 0 ? (
          <section className="mt-16">
            <div className="mb-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
                Curated for you
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Explore our collections
              </h2>
            </div>
            <Carousel>
              {tree.map((node, i) => (
                <CollectionCard key={node.id} node={node} index={i} />
              ))}
            </Carousel>
          </section>
        ) : null}
      </main>
    </>
  );
}

const COLLECTION_ARTS = [
  "linear-gradient(145deg,#F1ECE2,#FBF9F5)",
  "linear-gradient(145deg,#EAF0EF,#FAFBFB)",
  "linear-gradient(145deg,#F1ECF2,#FBF9FB)",
  "linear-gradient(145deg,#F0EEE6,#FAFAF6)",
  "linear-gradient(145deg,#EDF1F4,#FAFBFC)",
  "linear-gradient(145deg,#F3EDE8,#FBF8F5)",
];

function CollectionCard({ node, index }: { node: NavNode; index: number }) {
  return (
    <Link
      href={`/category/${node.slug}`}
      className="group relative flex min-h-[300px] w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-line p-6 shadow-soft transition-transform hover:-translate-y-1 sm:w-[46%] lg:w-[31.5%]"
      style={{ background: COLLECTION_ARTS[index % COLLECTION_ARTS.length] }}
    >
      <span
        className="pointer-events-none absolute -right-10 top-8 h-44 w-44 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--accent)" }}
      />
      <div className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
          Collection
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/70 text-ink transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </div>
      <div className="relative">
        <h3 className="text-2xl font-bold tracking-tight">{node.name}</h3>
        <p className="mt-1 text-sm text-ink-muted">
          {node.children.length} categories &middot; Shop the range
        </p>
      </div>
    </Link>
  );
}

function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6">
      <span
        className="mb-4 h-2.5 w-2.5 rounded-full"
        style={{ background: "var(--accent)" }}
      />
      <h1 className="text-2xl font-bold">Premier Commerce</h1>
      <p className="mt-3 text-ink-soft">
        The storefront is running, but no tenant was resolved. To load Bizrah
        Electronics:
      </p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
        <li>
          Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">apps/web/.env.local</code> and set the
          Supabase keys.
        </li>
        <li>
          Run <code className="font-mono">supabase start</code>, then{" "}
          <code className="font-mono">npm run db:reset</code>.
        </li>
        <li>Reload — the seeded <code className="font-mono">bizrah</code> tenant resolves.</li>
      </ol>
    </main>
  );
}
