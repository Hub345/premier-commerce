import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getCategoryWithProducts } from "@/lib/catalog";
import {
  buildFacets,
  parseListingParams,
  priceBounds,
  queryListing,
} from "@/lib/listing";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/plp/ProductFilters";
import { ActiveFilters } from "@/components/plp/ActiveFilters";
import { SortSelect } from "@/components/plp/SortSelect";
import { Stage } from "@/components/site/Stage";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) notFound();

  const { category, trail, subcategories, hero, products } =
    await getCategoryWithProducts(business.id, slug);
  if (!category) notFound();

  const facets = buildFacets(products);
  const bounds = priceBounds(products);
  const listParams = parseListingParams(sp, facets.map((f) => f.key));
  const { items, total, page, pageSize } = queryListing(products, listParams);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Stage
        sceneKey={category.slug}
        kicker={hero?.kicker ?? category.name}
        headline={hero?.headline ?? category.name}
        ctaHref="#products"
        ctaLabel={`Explore ${category.name}`}
        bg={hero?.bg}
        imageUrl={hero?.imageUrl}
        flagship={products[0]?.name ?? null}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="font-mono text-xs text-ink-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          {trail.map((t, i) => (
            <span key={t.slug}>
              {" / "}
              {i === trail.length - 1 ? (
                <span className="text-ink">{t.name}</span>
              ) : (
                <Link href={`/category/${t.slug}`} className="hover:text-ink">
                  {t.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Sub-category navigation */}
        {subcategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {subcategories.map((s) => (
              <Link
                key={s.slug}
                href={`/category/${s.slug}`}
                className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm transition-colors hover:border-ink/30"
              >
                {s.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div
          id="products"
          className="mt-6 flex scroll-mt-24 items-center justify-between gap-4"
        >
          <p className="text-sm text-ink-muted">
            {total} product{total === 1 ? "" : "s"}
          </p>
          <SortSelect />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[248px_1fr]">
          <ProductFilters
            facets={facets}
            boundsMin={bounds.minCents}
            boundsMax={bounds.maxCents}
          />

          <div>
            <ActiveFilters facets={facets} />

            {items.length === 0 ? (
              <div className="rounded-3xl border border-line bg-surface p-12 text-center text-ink-muted">
                No products match these filters.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} currency={business.currency} />
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link
                    href={pageHref(sp, page - 1)}
                    scroll={false}
                    className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium hover:border-ink/30"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-full border border-line px-5 py-2 text-sm font-medium opacity-40">
                    Previous
                  </span>
                )}
                <span className="font-mono text-sm text-ink-muted">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(sp, page + 1)}
                    scroll={false}
                    className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium hover:border-ink/30"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-full border border-line px-5 py-2 text-sm font-medium opacity-40">
                    Next
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
