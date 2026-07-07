"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { NavNode } from "@/lib/nav-types";

export function MegaMenu({ tree }: { tree: NavNode[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeNode = tree.find((n) => n.id === active) ?? null;

  function clearClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  function open(id: string) {
    clearClose();
    setActive(id);
  }
  // 150ms grace period so crossing the small gap to the panel doesn't close it.
  function scheduleClose() {
    clearClose();
    closeTimer.current = setTimeout(() => setActive(null), 150);
  }
  function closeNow() {
    clearClose();
    setActive(null);
  }

  return (
    <>
      {/* ── Desktop ── */}
      <nav
        className="relative hidden md:block"
        onMouseEnter={clearClose}
        onMouseLeave={scheduleClose}
      >
        {/* overflow-x-auto + shrink-0/whitespace-nowrap on every pill: labels
            never wrap mid-word, they scroll instead — this has to hold for
            any tenant's category names, not just Bizrah's. */}
        <ul className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <li className="shrink-0">
            {/* "Shop" is the master entry point — same fixed gutter/hit-area
                as every category pill, but a touch heavier to read as the
                anchor of the row rather than one more sibling. */}
            <Link
              href="/shop"
              className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              Shop
            </Link>
          </li>
          {tree.map((node) => (
            <li key={node.id} className="shrink-0" onMouseEnter={() => open(node.id)}>
              {/* Top-level label is a real destination: click = go to the Stage. */}
              <Link
                href={`/category/${node.slug}`}
                onClick={closeNow}
                onFocus={() => open(node.id)}
                aria-expanded={active === node.id}
                className={`block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === node.id ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {node.name}
              </Link>
            </li>
          ))}
        </ul>

        <AnimatePresence>
          {activeNode && activeNode.children.length > 0 ? (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              // pt-3 is an invisible bridge — the panel is part of the hover
              // container, so there is no dead zone between trigger and menu.
              className="absolute left-1/2 top-full z-40 -translate-x-1/2 pt-3"
            >
              <div className="w-max max-w-[46rem] rounded-3xl border border-line bg-surface p-6 shadow-soft">
                <div className="mb-3 flex items-center justify-between gap-8 border-b border-line pb-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                    {activeNode.name}
                  </span>
                  <Link
                    href={`/category/${activeNode.slug}`}
                    onClick={closeNow}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    View all &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 sm:grid-cols-3">
                  {activeNode.children.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      onClick={closeNow}
                      className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink"
                    >
                      <span>{c.name}</span>
                      <span
                        className="translate-x-[-4px] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        style={{ color: "var(--accent)" }}
                      >
                        &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>

      {/* ── Mobile ── */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={mobileOpen}
        className="md:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          {mobileOpen ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-line bg-surface p-4 md:hidden"
          >
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="block border-b border-line py-3 text-sm font-semibold"
            >
              Shop
            </Link>
            {tree.map((node) => (
              <div key={node.id} className="border-b border-line py-3 last:border-0">
                <Link
                  href={`/category/${node.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold"
                >
                  {node.name}
                </Link>
                {node.children.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {node.children.map((c) => (
                      <Link
                        key={c.id}
                        href={`/category/${c.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-ink-muted"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
