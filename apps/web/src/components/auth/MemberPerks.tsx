const PERKS = [
  {
    title: "Earn rewards on every purchase",
    copy: "Points land on your account automatically at checkout.",
    icon: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3z" />,
  },
  {
    title: "Exclusive coupons and early access",
    copy: "First look at new arrivals and member-only pricing.",
    icon: <path d="M12 2l2.4 6.9H21l-5.7 4.2L17.6 20 12 15.8 6.4 20l2.3-6.9L3 8.9h6.6z" />,
  },
  {
    title: "Track repairs and warranty status",
    copy: "One place to see every claim, from open to resolved.",
    icon: <path d="M14 6l4 4-8 8H6v-4l8-8zM12 8l4 4" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Faster checkout and order history",
    copy: "Your details are remembered — just confirm and go.",
    icon: <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export function MemberPerks({ businessName }: { businessName: string }) {
  return (
    <div className="flex h-full flex-col justify-center rounded-3xl border border-line bg-paper p-8 sm:p-10">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
        Membership
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        Join to enjoy member perks
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        Free to join {businessName} — no fees, no catch.
      </p>

      <ul className="mt-8 space-y-6">
        {PERKS.map((p) => (
          <li key={p.title} className="flex items-start gap-4">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface"
              style={{ color: "var(--accent)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {p.icon}
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{p.title}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{p.copy}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
