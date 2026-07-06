import { getCurrentBusiness } from "@/lib/tenant";

function Trust({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

const PAYMENTS = ["M-Pesa", "Airtel Money", "Visa", "Mastercard"];

export async function SiteFooter() {
  const business = await getCurrentBusiness();
  const name = business?.name ?? "Premier";

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 border-b border-line py-8 sm:grid-cols-4">
          <Trust label="Free delivery" sub="Countrywide, orders over KSh 5,000" />
          <Trust label="14-day returns" sub="Shop with confidence" />
          <Trust label="Genuine warranty" sub="Authorized stock only" />
          <Trust label="Secure checkout" sub="Encrypted & protected" />
        </div>

        {/* Payment is a utility, not a brand identity — it lives here. */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Supported payments
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-md border border-line px-3 py-1 text-xs font-medium text-ink-soft"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-6 font-mono text-xs text-ink-muted">
          <span>{name} &middot; Powered by Premier Commerce</span>
          <span>
            {business ? `tenant: ${business.slug}` : ""}
            {business?.vat.enabled ? " · VAT registered" : ""}
          </span>
        </div>
      </div>
    </footer>
  );
}
