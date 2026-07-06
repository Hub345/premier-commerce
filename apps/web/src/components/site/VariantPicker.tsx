"use client";

import { useState } from "react";
import type { CurrencyCode, Product, VatConfig } from "@premier/protocol";
import { formatMoney, splitInclusiveVat } from "@premier/protocol";
import { useCart } from "@/lib/cart/store";

export function VariantPicker({
  product,
  currency,
  vat,
}: {
  product: Product;
  currency: CurrencyCode;
  vat: VatConfig;
}) {
  const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(def?.id);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const variant = product.variants.find((v) => v.id === selectedId) ?? def;

  if (!variant) return null;

  const vatInfo = vat.enabled ? splitInclusiveVat(variant.priceCents, vat.rate) : null;
  const inStock = variant.stock > 0;

  function handleAdd() {
    if (!variant || !inStock) return;
    add({
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      priceCents: variant.priceCents,
      image: product.images[0] ?? variant.images[0] ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight">
          {formatMoney(variant.priceCents, currency)}
        </span>
        {variant.compareAtCents ? (
          <s className="text-lg text-ink-muted">
            {formatMoney(variant.compareAtCents, currency)}
          </s>
        ) : null}
      </div>
      {vatInfo ? (
        <p className="mt-1 text-xs text-ink-muted">
          Incl. {formatMoney(vatInfo.vatCents, currency)} VAT ({Math.round(vat.rate * 100)}%)
        </p>
      ) : null}

      {product.variants.length > 1 ? (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Options
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  v.id === variant.id
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface hover:border-ink/40"
                }`}
              >
                {v.label ?? v.sku ?? "Option"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-sm">
        {inStock ? (
          <span style={{ color: "var(--accent)" }}>
            &#9679; In stock &middot; {variant.stock} available
          </span>
        ) : (
          <span className="text-ink-muted">Out of stock</span>
        )}
      </p>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!inStock}
        className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-40"
        style={{ background: "var(--primary)" }}
      >
        {added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
