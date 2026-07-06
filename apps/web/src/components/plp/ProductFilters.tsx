"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney } from "@premier/protocol";
import type { Facet } from "@/lib/listing";
import { useListingUrl } from "@/components/plp/use-listing-url";

export function ProductFilters({
  facets,
  boundsMin,
  boundsMax,
}: {
  facets: Facet[];
  boundsMin: number;
  boundsMax: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const panel = (
    <FilterPanel facets={facets} boundsMin={boundsMin} boundsMax={boundsMax} />
  );

  return (
    <>
      <aside className="hidden lg:block">{panel}</aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
        </svg>
        Filters
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {mobileOpen ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm lg:hidden"
                  onClick={() => setMobileOpen(false)}
                >
                  <motion.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-0 h-full w-full max-w-xs overflow-y-auto bg-surface p-5 shadow-soft"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-base font-semibold">Filters</h2>
                      <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    {panel}
                  </motion.aside>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

function FilterPanel({
  facets,
  boundsMin,
  boundsMax,
}: {
  facets: Facet[];
  boundsMin: number;
  boundsMax: number;
}) {
  const { searchParams, clearAll } = useListingUrl();
  const hasActive =
    searchParams.has("minp") ||
    searchParams.has("maxp") ||
    facets.some((f) => searchParams.has(f.key));

  return (
    <div>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Filters
        </h2>
        {hasActive ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-ink-muted underline hover:text-ink"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <PriceSection boundsMin={boundsMin} boundsMax={boundsMax} />
      {facets.map((facet) => (
        <FacetSection key={facet.key} facet={facet} />
      ))}
    </div>
  );
}

function Accordion({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-line py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold">
          {title}
          {count ? <span className="text-ink-muted"> ({count})</span> : null}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function CheckboxVisual({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${
        checked ? "border-transparent" : "border-ink/25"
      }`}
      style={checked ? { background: "var(--primary)" } : undefined}
    >
      {checked ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

function FacetSection({ facet }: { facet: Facet }) {
  const { searchParams, currentParams, commit } = useListingUrl();
  const selected = new Set(
    (searchParams.get(facet.key) ?? "").split(",").filter(Boolean),
  );

  function toggle(value: string) {
    const params = currentParams();
    const set = new Set(
      (params.get(facet.key) ?? "").split(",").filter(Boolean),
    );
    if (set.has(value)) set.delete(value);
    else set.add(value);
    if (set.size) params.set(facet.key, [...set].join(","));
    else params.delete(facet.key);
    commit(params);
  }

  return (
    <Accordion title={facet.label} count={selected.size}>
      <div className="space-y-0.5 pb-1">
        {facet.values.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => toggle(v.value)}
            className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-paper"
          >
            <CheckboxVisual checked={selected.has(v.value)} />
            <span className="flex-1 text-sm text-ink">{v.value}</span>
            <span className="font-mono text-xs text-ink-muted">{v.count}</span>
          </button>
        ))}
      </div>
    </Accordion>
  );
}

function PriceSection({
  boundsMin,
  boundsMax,
}: {
  boundsMin: number;
  boundsMax: number;
}) {
  const { searchParams, currentParams, commit } = useListingUrl();
  const curMin = Number(searchParams.get("minp") ?? boundsMin);
  const curMax = Number(searchParams.get("maxp") ?? boundsMax);
  const [lo, setLo] = useState(curMin);
  const [hi, setHi] = useState(curMax);

  useEffect(() => {
    setLo(curMin);
    setHi(curMax);
  }, [curMin, curMax]);

  const step = Math.max(1, Math.round((boundsMax - boundsMin) / 100));

  function apply(loCents: number, hiCents: number) {
    const clampedLo = Math.max(boundsMin, Math.min(loCents, hiCents));
    const clampedHi = Math.min(boundsMax, Math.max(hiCents, clampedLo));
    const params = currentParams();
    if (clampedLo > boundsMin) params.set("minp", String(clampedLo));
    else params.delete("minp");
    if (clampedHi < boundsMax) params.set("maxp", String(clampedHi));
    else params.delete("maxp");
    commit(params);
  }

  return (
    <Accordion title="Price">
      <div className="px-1 pb-2">
        <input
          type="range"
          min={boundsMin}
          max={boundsMax}
          step={step}
          value={hi}
          onChange={(e) => setHi(Number(e.target.value))}
          onMouseUp={() => apply(lo, hi)}
          onTouchEnd={() => apply(lo, hi)}
          onKeyUp={() => apply(lo, hi)}
          aria-label="Maximum price"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-[color:var(--primary)]"
        />
        <div className="mt-3 flex items-center gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-muted">Min</span>
            <input
              type="number"
              value={Math.round(lo / 100)}
              onChange={(e) => setLo(Number(e.target.value) * 100)}
              onBlur={() => apply(lo, hi)}
              onKeyDown={(e) => e.key === "Enter" && apply(lo, hi)}
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-ink/40"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-muted">Max</span>
            <input
              type="number"
              value={Math.round(hi / 100)}
              onChange={(e) => setHi(Number(e.target.value) * 100)}
              onBlur={() => apply(lo, hi)}
              onKeyDown={(e) => e.key === "Enter" && apply(lo, hi)}
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-ink/40"
            />
          </label>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-muted">
          {formatMoney(lo, "KES")} – {formatMoney(hi, "KES")}
        </p>
      </div>
    </Accordion>
  );
}
