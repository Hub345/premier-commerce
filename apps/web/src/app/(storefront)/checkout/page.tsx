"use client";

import { useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import { formatMoney } from "@premier/protocol";
import { useCart, cartSubtotal } from "@/lib/cart/store";

type Phase = "form" | "working" | "done" | "error";

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  const subtotal = cartSubtotal(items);

  async function pollStatus(orderId: string): Promise<boolean> {
    for (let i = 0; i < 18; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/v1/payments/status?orderId=${orderId}`);
        const data = await res.json();
        if (data.orderStatus === "paid") return true;
      } catch {
        // keep polling
      }
    }
    return false;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setPhase("working");
    setMessage("Placing your order…");

    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: { phone, name: name || undefined },
        }),
      });
      const order = await res.json();
      if (!res.ok) {
        setPhase("error");
        setMessage(
          order.error === "demo_mode"
            ? "This is a preview without a database connected. Connect Supabase to place real orders."
            : (order.error ?? "Checkout failed."),
        );
        return;
      }
      setReference(order.reference);

      setMessage("Sending M-Pesa prompt to your phone…");
      const stk = await fetch("/api/v1/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, phone }),
      });
      const stkData = await stk.json();

      if (!stk.ok) {
        // The order is placed; payment couldn't be initiated (e.g. no live creds).
        clear();
        setPhase("done");
        setMessage(
          stkData.error === "mpesa_not_configured"
            ? "Your order is placed. M-Pesa isn’t configured in this environment yet — add Daraja credentials to enable live payment."
            : stkData.message ?? "Order placed. Payment could not be started.",
        );
        return;
      }

      setMessage("Enter your M-Pesa PIN on your phone to confirm…");
      const paid = await pollStatus(order.id);
      clear();
      setPhase("done");
      setMessage(
        paid
          ? "Payment received — thank you! Your order is confirmed."
          : "Your order is placed. We’re still awaiting M-Pesa confirmation — check your phone.",
      );
    } catch {
      setPhase("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (phase === "done") {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: "var(--accent)" }}
        >
          ✓
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Order {reference}</h1>
        <p className="mt-3 text-ink-soft">{message}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium"
        >
          Browse the store
        </Link>
      </main>
    );
  }

  const working = phase === "working";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_20rem]">
        {/* Details */}
        <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Delivery &amp; payment
          </h2>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">M-Pesa phone number</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-ink/40"
              />
              <span className="mt-1 block text-xs text-ink-muted">
                You’ll receive an STK push prompt to pay.
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-ink/40"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={working}
            className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform enabled:hover:scale-[1.01] disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {working ? "Processing…" : `Pay ${formatMoney(subtotal, "KES")} with M-Pesa`}
          </button>
          {working ? (
            <p className="mt-3 text-center text-sm text-ink-muted">{message}</p>
          ) : null}
          {phase === "error" ? (
            <p className="mt-3 text-center text-sm" style={{ color: "#C0392B" }}>
              {message}
            </p>
          ) : null}
        </form>

        {/* Summary */}
        <aside className="h-fit rounded-3xl border border-line bg-surface p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Order summary
          </h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{item.name}</span>
                  <span className="text-ink-muted">×{item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatMoney(item.priceCents * item.quantity, "KES")}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{formatMoney(subtotal, "KES")}</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">VAT included where applicable.</p>
        </aside>
      </div>
    </main>
  );
}
