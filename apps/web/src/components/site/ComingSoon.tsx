export function ComingSoon({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <span
        className="mx-auto mb-4 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ background: "var(--accent)", color: "var(--ink, #161613)" }}
      >
        Coming soon
      </span>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">{kicker}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm text-ink-soft">{copy}</p>
    </main>
  );
}
