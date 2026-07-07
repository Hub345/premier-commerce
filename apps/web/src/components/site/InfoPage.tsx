import type { ReactNode } from "react";

export function InfoPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
        {kicker}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </main>
  );
}
