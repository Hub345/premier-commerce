import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { getCurrentBusiness } from "@/lib/tenant";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { SocialLink } from "@/components/site/SocialLink";

function Trust({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

const PAYMENTS = ["M-Pesa", "Airtel Money", "Visa", "Mastercard"];

const SUPPORT_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "Help Center", href: "/help" },
  { label: "Warranties", href: "/warranty" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Sustainability", href: "/sustainability" },
];

export async function SiteFooter() {
  const business = await getCurrentBusiness();
  const name = business?.name ?? "Premier";
  const contact = business?.contact;

  const socials: { platform: "facebook" | "instagram" | "youtube" | "x"; href: string }[] = [
    contact?.facebookUrl ? { platform: "facebook", href: contact.facebookUrl } : null,
    contact?.instagramUrl ? { platform: "instagram", href: contact.instagramUrl } : null,
    contact?.youtubeUrl ? { platform: "youtube", href: contact.youtubeUrl } : null,
    contact?.xUrl ? { platform: "x", href: contact.xUrl } : null,
  ].filter((s): s is { platform: "facebook" | "instagram" | "youtube" | "x"; href: string } => s !== null);

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 border-b border-line py-8 sm:grid-cols-4">
          <Trust label="Free delivery" sub="Countrywide, orders over KSh 5,000" />
          <Trust label="14-day returns" sub="Shop with confidence" />
          <Trust label="Genuine warranty" sub="Authorized stock only" />
          <Trust label="Secure checkout" sub="Encrypted & protected" />
        </div>

        {/* The Zenith Signature — brand, support, company, and the social/contact hub. */}
        <div className="grid grid-cols-1 gap-10 border-b border-line py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-base font-semibold tracking-tight">{name}</span>
            </Link>
            <p className="mt-4 text-sm font-semibold text-ink">Get Updates and Offers</p>
            <div className="mt-3 max-w-xs">
              <NewsletterForm />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Support
            </p>
            <ul className="mt-4 space-y-3">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Connect
            </p>
            <ul className="mt-4 space-y-3">
              {contact?.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
                  >
                    <Phone size={14} />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact?.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
                  >
                    <Mail size={14} />
                    {contact.email}
                  </a>
                </li>
              ) : null}
            </ul>
            {socials.length > 0 ? (
              <div className="mt-4 flex gap-2">
                {socials.map((s) => (
                  <SocialLink key={s.platform} platform={s.platform} href={s.href} />
                ))}
              </div>
            ) : null}
          </div>
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

        <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-ink-muted">
          <span>
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms of Use
            </Link>
            <span className="font-mono">
              {business ? `tenant: ${business.slug}` : ""}
              {business?.vat.enabled ? " · VAT registered" : ""}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
