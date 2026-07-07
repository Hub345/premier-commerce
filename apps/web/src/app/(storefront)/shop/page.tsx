import { getCurrentBusiness } from "@/lib/tenant";
import { getFeaturedCategoriesWithProducts } from "@/lib/catalog";
import { FeaturedSections } from "@/components/site/FeaturedSections";
import { BenefitsGallery } from "@/components/site/BenefitsGallery";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const blocks = await getFeaturedCategoriesWithProducts(business.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
          The Grand Gallery
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Everything Bizrah, at a glance.
        </h1>
      </div>

      <FeaturedSections blocks={blocks} />
      <BenefitsGallery benefits={business.benefits} />
    </main>
  );
}
