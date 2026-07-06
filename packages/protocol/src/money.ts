// Money helpers. The one rule: amounts are integer cents in transit and at rest;
// they become floats only at the last moment, for display.

import type { Cents, CurrencyCode } from "./types";

/** Convert a major-unit amount (e.g. 1299.99) to integer cents. */
export function toCents(amount: number): Cents {
  return Math.round(amount * 100);
}

/** Convert integer cents back to a major-unit number. */
export function fromCents(cents: Cents): number {
  return cents / 100;
}

const FORMATTERS: Partial<Record<CurrencyCode, Intl.NumberFormat>> = {};

/** Format cents as a localized currency string, e.g. 129900 → "KSh 1,299.00". */
export function formatMoney(
  cents: Cents,
  currency: CurrencyCode = "KES",
): string {
  let fmt = FORMATTERS[currency];
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    FORMATTERS[currency] = fmt;
  }
  return fmt.format(fromCents(cents));
}

export interface VatBreakdown {
  /** Net amount excluding VAT. */
  netCents: Cents;
  /** The VAT portion. */
  vatCents: Cents;
  /** Gross amount including VAT (equals the input for inclusive pricing). */
  grossCents: Cents;
  rate: number;
}

/**
 * Kenyan retail prices are displayed VAT-inclusive. Given a gross (shelf) price
 * and a fractional rate, split out the embedded VAT component.
 */
export function splitInclusiveVat(grossCents: Cents, rate: number): VatBreakdown {
  if (rate <= 0) {
    return { netCents: grossCents, vatCents: 0, grossCents, rate: 0 };
  }
  const netCents = Math.round(grossCents / (1 + rate));
  return { netCents, vatCents: grossCents - netCents, grossCents, rate };
}
