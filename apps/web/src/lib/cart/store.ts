"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// The cart is a client-side display snapshot. Prices here are for UI only —
// checkout always reprices from the database server-side. Never trust these.
export interface CartItem {
  variantId: string;
  productSlug: string;
  name: string;
  variantLabel: string | null;
  priceCents: number;
  image: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.variantId !== variantId)
              : s.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity: qty } : i,
                ),
        })),
      remove: (variantId) =>
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "premier-cart" },
  ),
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.priceCents * i.quantity, 0);
}
