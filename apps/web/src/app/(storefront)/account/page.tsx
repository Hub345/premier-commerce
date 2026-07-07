import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getCurrentMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/favorites", label: "Favorites" },
  { href: "/account/subscriptions", label: "Manage Subscriptions" },
  { href: "/rewards", label: "Rewards" },
];

export default async function AccountPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const member = await getCurrentMember(business.id);
  if (!member) redirect("/sign-in");
  if (!member.onboarded) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">My Account</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Welcome, {member.fullName ?? "there"}.
      </h1>
      <p className="mt-1 text-sm text-ink-soft">{member.email}</p>

      <div className="mt-10 grid grid-cols-2 gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
