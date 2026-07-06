"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney } from "@premier/protocol";
import { useCart, cartCount, cartSubtotal } from "@/lib/cart/store";

export function CartWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  // Avoid hydration mismatch: the persisted cart only exists on the client.
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;
  const subtotal = cartSubtotal(items);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cart, ${count} items`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h2l1.6 11.2a1 1 0 001 .8h8.8a1 1 0 001-.8L21 8H7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        {count > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-ink"
            style={{ background: "var(--accent)" }}
          >
            {count}
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                >
                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-soft"
                  >
                    <div className="flex items-center justify-between border-b border-line px-5 py-4">
                      <h2 className="text-base font-semibold">Your cart</h2>
                      <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      {items.length === 0 ? (
                        <p className="mt-16 text-center text-sm text-ink-muted">Your cart is empty.</p>
                      ) : (
                        <ul className="space-y-4">
                          {items.map((item) => (
                            <li key={item.variantId} className="flex gap-3">
                              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-paper font-mono text-xs text-ink/25">
                                {item.name.slice(0, 2)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{item.name}</p>
                                {item.variantLabel ? (
                                  <p className="text-xs text-ink-muted">{item.variantLabel}</p>
                                ) : null}
                                <div className="mt-1.5 flex items-center gap-2">
                                  <div className="flex items-center rounded-full border border-line">
                                    <button type="button" onClick={() => setQty(item.variantId, item.quantity - 1)} className="px-2.5 py-0.5 text-ink-muted hover:text-ink" aria-label="Decrease">−</button>
                                    <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                                    <button type="button" onClick={() => setQty(item.variantId, item.quantity + 1)} className="px-2.5 py-0.5 text-ink-muted hover:text-ink" aria-label="Increase">+</button>
                                  </div>
                                  <button type="button" onClick={() => remove(item.variantId)} className="text-xs text-ink-muted underline hover:text-ink">Remove</button>
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-semibold">
                                {formatMoney(item.priceCents * item.quantity, "KES")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {items.length > 0 ? (
                      <div className="border-t border-line px-5 py-4">
                        <div className="mb-3 flex items-center justify-between text-sm">
                          <span className="text-ink-muted">Subtotal</span>
                          <span className="font-semibold">{formatMoney(subtotal, "KES")}</span>
                        </div>
                        <Link
                          href="/checkout"
                          onClick={() => setOpen(false)}
                          className="block rounded-full px-6 py-3 text-center text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                          style={{ background: "var(--primary)" }}
                        >
                          Checkout
                        </Link>
                      </div>
                    ) : null}
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
