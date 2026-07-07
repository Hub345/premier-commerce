"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function OrderLookupForm() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/v1/orders/lookup?reference=${encodeURIComponent(reference)}&phone=${encodeURIComponent(phone)}`,
      );
      if (!res.ok) throw new Error();
      router.push(`/order/${encodeURIComponent(reference)}?phone=${encodeURIComponent(phone)}`);
    } catch {
      toast.error("We couldn't find that order. Double-check your reference and phone number.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">Order Reference</label>
        <input
          required
          placeholder="BZR-XXXXXXX"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">Phone Number</label>
        <input
          required
          placeholder="07XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Looking up…" : "Find my order"}
      </button>
    </form>
  );
}
