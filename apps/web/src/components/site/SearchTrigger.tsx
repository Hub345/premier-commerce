"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@premier/protocol";
import { formatMoney } from "@premier/protocol";

interface Hit {
  product: Product;
  score: number;
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // ⌘K / Ctrl+K to open, Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  // Debounced search against the tenant-scoped FTS endpoint.
  useEffect(() => {
    if (!open) return;
    const q = term.trim();
    if (q.length === 0) {
      setHits([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/catalog/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setHits(Array.isArray(data.items) ? data.items : []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [term, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 items-center gap-2 rounded-full px-3 text-ink-soft transition-colors hover:bg-paper hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
        </svg>
        <kbd className="hidden font-mono text-[10px] text-ink-muted sm:inline">⌘K</kbd>
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-soft"
                  >
                    <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-muted">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
                      </svg>
                      <input
                        ref={inputRef}
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Search products…"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
                      />
                      <kbd className="font-mono text-[10px] text-ink-muted">esc</kbd>
                    </div>

                    <div className="max-h-[52vh] overflow-y-auto p-2">
                      {loading && hits.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-ink-muted">Searching…</p>
                      ) : term.trim() && hits.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-ink-muted">
                          No matches for &ldquo;{term.trim()}&rdquo;.
                        </p>
                      ) : (
                        hits.map(({ product }) => {
                          const brand = product.attributes.brand;
                          return (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-paper"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper font-mono text-xs text-ink/25">
                                {product.name.slice(0, 2)}
                              </span>
                              <span className="min-w-0 flex-1">
                                {brand ? (
                                  <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                    {String(brand)}
                                  </span>
                                ) : null}
                                <span className="block truncate text-sm text-ink">{product.name}</span>
                              </span>
                              <span className="shrink-0 text-sm font-semibold">
                                {formatMoney(product.fromPriceCents, "KES")}
                              </span>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
