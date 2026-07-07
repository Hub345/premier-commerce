"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategoryRow, AdminProduct } from "@/lib/catalog";
import type { CurrencyCode } from "@premier/protocol";
import { formatMoney } from "@premier/protocol";
import { ProductEditor } from "@/components/admin/ProductEditor";

type Row = { product: AdminProduct };

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600";

function defaultVariant(p: AdminProduct) {
  return p.variants.find((v) => v.isDefault) ?? p.variants[0] ?? null;
}

export function AtomicVault({
  products,
  categories,
  currency,
}: {
  products: AdminProduct[];
  categories: AdminCategoryRow[];
  currency: CurrencyCode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          String(p.attributes.brand ?? "").toLowerCase().includes(q),
      )
      .map((product) => ({ product }));
  }, [products, query]);

  const editing = products.find((p) => p.id === openId) ?? null;

  function handleSaved() {
    // Full editor changes (new/removed variants, category, images) reshape
    // the product enough that re-fetching fresh server data is simpler and
    // safer than hand-patching local state — router.refresh() re-runs the
    // server component's data fetch without a full page reload.
    router.refresh();
  }

  return (
    <div className="flex h-screen flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
            Archetype 03
          </p>
          <h1 className="text-lg font-semibold">Atomic Vault</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className={`${inputClass} max-w-xs`}
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-950"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200 transition-colors dark:border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur transition-colors dark:bg-zinc-950/90">
            <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <th className="px-4 py-3 font-normal">Product</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Stock</th>
              <th className="px-4 py-3 text-right font-normal">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product }) => {
              const v = defaultVariant(product);
              const stock = v?.stock ?? 0;
              const onSale = (v?.compareAtCents ?? null) !== null;
              const thumb = product.images[0] ?? v?.images[0] ?? null;
              return (
                <tr
                  key={product.id}
                  onClick={() => setOpenId(product.id)}
                  className="cursor-pointer border-t border-zinc-200 transition-colors hover:bg-zinc-200/50 dark:border-zinc-800/70 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-200 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {product.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        {product.attributes.brand ? (
                          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            {String(product.attributes.brand)}
                          </p>
                        ) : null}
                      </div>
                      {onSale ? (
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                          Sale
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        stock === 0 ? "text-red-500" : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${stock === 0 ? "bg-red-500" : "bg-emerald-500"}`}
                      />
                      {stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {v ? formatMoney(v.priceCents, currency) : "—"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  {products.length === 0 ? "No products yet." : `No matches for “${query}”.`}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <ProductEditor
          mode="edit"
          product={editing}
          categories={categories}
          currency={currency}
          onClose={() => setOpenId(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {creating ? (
        <ProductEditor
          mode="create"
          categories={categories}
          currency={currency}
          onClose={() => setCreating(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: AdminProduct["status"] }) {
  const map: Record<AdminProduct["status"], string> = {
    published: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    draft: "bg-zinc-400/15 text-zinc-500 dark:text-zinc-400",
    archived: "bg-red-500/15 text-red-500 dark:text-red-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
