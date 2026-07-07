// Instant skeleton while a product page renders — same rationale as the
// category loading state: don't leave the previous page frozen during the
// server render, and let Next prefetch the route up to this boundary.
export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-6 py-10">
      <div className="h-3 w-48 rounded bg-line" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square w-full rounded-3xl bg-line" />
        <div>
          <div className="h-3 w-24 rounded bg-line" />
          <div className="mt-3 h-9 w-3/4 rounded-xl bg-line" />
          <div className="mt-6 h-7 w-32 rounded bg-line" />
          <div className="mt-8 space-y-2">
            <div className="h-3 w-full rounded bg-line" />
            <div className="h-3 w-5/6 rounded bg-line" />
            <div className="h-3 w-2/3 rounded bg-line" />
          </div>
          <div className="mt-8 flex gap-2">
            <div className="h-11 w-28 rounded-full bg-line" />
            <div className="h-11 w-28 rounded-full bg-line" />
          </div>
          <div className="mt-8 h-12 w-full rounded-full bg-line" />
        </div>
      </div>
    </main>
  );
}
