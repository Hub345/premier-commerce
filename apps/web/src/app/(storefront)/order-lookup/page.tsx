import { OrderLookupForm } from "@/components/site/OrderLookupForm";

export default function OrderLookupPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">Order Look Up</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Find your order</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter the reference and phone number from your confirmation.
      </p>
      <div className="mt-8">
        <OrderLookupForm />
      </div>
    </main>
  );
}
