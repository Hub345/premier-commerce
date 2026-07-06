"use client";

import { formatMoney } from "@premier/protocol";
import type { Facet } from "@/lib/listing";
import { useListingUrl } from "@/components/plp/use-listing-url";

export function ActiveFilters({ facets }: { facets: Facet[] }) {
  const { searchParams, currentParams, commit } = useListingUrl();

  const chips: { key: string; value: string; label: string }[] = [];
  for (const facet of facets) {
    const values = (searchParams.get(facet.key) ?? "").split(",").filter(Boolean);
    for (const value of values) {
      chips.push({ key: facet.key, value, label: value });
    }
  }
  const minp = searchParams.get("minp");
  const maxp = searchParams.get("maxp");
  if (minp || maxp) {
    chips.push({
      key: "__price",
      value: "",
      label: `${minp ? formatMoney(Number(minp), "KES") : "Min"} – ${
        maxp ? formatMoney(Number(maxp), "KES") : "Max"
      }`,
    });
  }

  if (chips.length === 0) return null;

  function remove(chip: { key: string; value: string }) {
    const params = currentParams();
    if (chip.key === "__price") {
      params.delete("minp");
      params.delete("maxp");
    } else {
      const set = new Set(
        (params.get(chip.key) ?? "").split(",").filter(Boolean),
      );
      set.delete(chip.value);
      if (set.size) params.set(chip.key, [...set].join(","));
      else params.delete(chip.key);
    }
    commit(params);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <button
          key={`${chip.key}-${chip.value}-${i}`}
          type="button"
          onClick={() => remove(chip)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium transition-colors hover:border-ink/30"
        >
          {chip.label}
          <span className="text-ink-muted">✕</span>
        </button>
      ))}
    </div>
  );
}
