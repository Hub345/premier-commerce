import Link from "next/link";
import type { CurrencyCode, Product } from "@premier/protocol";
import { formatMoney } from "@premier/protocol";

export function ProductCard({
  product,
  currency = "KES",
}: {
  product: Product;
  currency?: CurrencyCode;
}) {
  const variant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const compareAt = variant?.compareAtCents ?? null;
  const brand = product.attributes.brand;
  const image = product.images[0] ?? variant?.images[0] ?? null;
  const initials = product.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("");

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-3xl border border-line bg-surface p-3 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(20,20,15,0.10)]"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="font-mono text-3xl text-ink/15">{initials}</span>
        )}
        {compareAt ? (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink"
            style={{ background: "var(--accent)" }}
          >
            Sale
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pb-1 pt-3">
        {brand ? (
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            {String(brand)}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-medium text-ink">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-sm font-semibold text-ink">
            {formatMoney(product.fromPriceCents, currency)}
          </span>
          {compareAt ? (
            <s className="text-xs text-ink-muted">
              {formatMoney(compareAt, currency)}
            </s>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
