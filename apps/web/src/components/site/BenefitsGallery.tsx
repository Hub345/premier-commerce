import type { BusinessBenefit } from "@premier/protocol";

// Visual design (gradient + icon) stays fixed per slot; only the title/copy
// is tenant-editable (Stage Manager's "Bizrah Promise" wording overrides).
const SLOT_STYLE = [
  {
    bg: "linear-gradient(160deg,#1B2430,#0E1319)",
    icon: (
      <path d="M4 15l6-11 6 11M7 15l3-6M4 15h12M18 15l2-4M18 15h2M18 15v4h-2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    bg: "linear-gradient(160deg,#20261E,#12160F)",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18M7 15h3" strokeLinecap="round" />
      </>
    ),
  },
  {
    bg: "linear-gradient(160deg,#241C2C,#140F19)",
    icon: (
      <path d="M14 6l4 4-8 8H6v-4l8-8zM12 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    bg: "linear-gradient(160deg,#2A1C1C,#170F0F)",
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3zM9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export function BenefitsGallery({ benefits }: { benefits: BusinessBenefit[] }) {
  if (benefits.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
          The Bizrah Promise
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Explore the benefits of Bizrah
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b, i) => {
          const slot = SLOT_STYLE[i % SLOT_STYLE.length] ?? SLOT_STYLE[0]!;
          return (
            <div
              key={b.title}
              className="group relative flex min-h-[19rem] flex-col justify-end overflow-hidden rounded-3xl p-6 text-white"
              style={{ background: slot.bg }}
            >
              <span
                className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30 blur-3xl transition-transform duration-500 group-hover:scale-125"
                style={{ background: "var(--accent)" }}
              />
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="relative z-10 mb-4 text-white/85"
              >
                {slot.icon}
              </svg>
              <h3 className="relative z-10 text-lg font-semibold">{b.title}</h3>
              <p className="relative z-10 mt-2 text-sm leading-relaxed text-white/70">
                {b.copy}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
