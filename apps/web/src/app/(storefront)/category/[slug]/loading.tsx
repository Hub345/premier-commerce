// Shown instantly on navigation to any category while the server renders the
// real page. Without this Suspense boundary, a `force-dynamic` route leaves
// the *previous* page frozen on screen for the full render — which is what
// made category switching feel sluggish. It also lets Next.js prefetch the
// route up to this boundary, so in production the click is near-instant.
export default function CategoryLoading() {
  return (
    <div className="animate-pulse">
      {/* Stage placeholder */}
      <section className="border-b border-line bg-paper/60">
        <div className="mx-auto grid min-h-[58vh] max-w-6xl items-center gap-8 px-6 py-16 lg:grid-cols-2">
          <div>
            <div className="h-3 w-32 rounded bg-line" />
            <div className="mt-5 h-14 w-3/4 rounded-2xl bg-line" />
            <div className="mt-3 h-14 w-1/2 rounded-2xl bg-line" />
            <div className="mt-9 h-12 w-40 rounded-full bg-line" />
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="h-72 w-72 rounded-[2.2rem] bg-line" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="h-3 w-40 rounded bg-line" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-line" />
          ))}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[248px_1fr]">
          <div className="hidden lg:block">
            <div className="h-64 w-full rounded-2xl bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-line bg-surface p-3">
                <div className="aspect-square w-full rounded-2xl bg-line" />
                <div className="mt-3 h-3 w-1/3 rounded bg-line" />
                <div className="mt-2 h-4 w-3/4 rounded bg-line" />
                <div className="mt-3 h-4 w-1/4 rounded bg-line" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
