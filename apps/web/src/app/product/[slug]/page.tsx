import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getProductBySlug } from "@/lib/catalog";
import { VariantPicker } from "@/components/site/VariantPicker";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getCurrentBusiness();
  if (!business) notFound();

  const product = await getProductBySlug(business.id, slug);
  if (!product) notFound();

  const brand = product.attributes.brand;
  const image = product.images[0] ?? product.variants[0]?.images[0] ?? null;
  const initials = product.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("");

  const specs = Object.entries(product.attributes).filter(
    ([key]) => key !== "brand",
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-6 font-mono text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        / {product.name}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-paper">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-5xl text-ink/15">{initials}</span>
            )}
          </div>
        </div>

        <div>
          {brand ? (
            <p
              className="font-mono text-xs uppercase tracking-[0.16em]"
              style={{ color: "var(--accent)" }}
            >
              {String(brand)}
            </p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>

          <VariantPicker
            product={product}
            currency={business.currency}
            vat={business.vat}
          />

          {product.description ? (
            <p className="mt-8 border-t border-line pt-6 leading-relaxed text-ink-soft">
              {product.description}
            </p>
          ) : null}

          {specs.length > 0 ? (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-line py-2">
                  <dt className="capitalize text-ink-muted">{key}</dt>
                  <dd className="font-medium text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </main>
  );
}
