"use client";

import { useState } from "react";
import { useListingUrl } from "@/components/plp/use-listing-url";

const OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export function SortSelect() {
  const { searchParams, currentParams, commit } = useListingUrl();
  const [open, setOpen] = useState(false);
  const current = searchParams.get("sort") ?? "relevance";
  const label = OPTIONS.find((o) => o.value === current)?.label ?? "Recommended";

  function choose(value: string) {
    const params = currentParams();
    if (value === "relevance") params.delete("sort");
    else params.set("sort", value);
    commit(params);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm"
      >
        <span className="text-ink-muted">Sort:</span>
        <span className="font-medium">{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-soft">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => choose(o.value)}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-paper ${
                  o.value === current ? "font-semibold" : ""
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
