"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// A reusable, dependency-light carousel built on native scroll-snap, so it is
// touch- and keyboard-friendly by default. Adds arrows, pagination dots, and
// autoplay (paused on hover). Children supply their own width + `snap-start`.
export function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const count = Math.max(1, Math.ceil((el.scrollWidth - 2) / el.clientWidth));
    setPages(count);
    setPage(Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth)));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const goto = useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(i, pages - 1));
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    },
    [pages],
  );

  // Autoplay, paused while the pointer is over the track.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let paused = false;
    const enter = () => {
      paused = true;
    };
    const leave = () => {
      paused = false;
    };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    const id = setInterval(() => {
      const node = ref.current;
      if (!node || paused) return;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 4;
      node.scrollTo({
        left: atEnd ? 0 : node.scrollLeft + node.clientWidth,
        behavior: "smooth",
      });
    }, 4500);
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => goto(page - 1)}
        aria-label="Previous"
        disabled={page === 0}
        className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-soft transition-transform hover:scale-105 disabled:opacity-0 sm:flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => goto(page + 1)}
        aria-label="Next"
        disabled={page >= pages - 1}
        className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-soft transition-transform hover:scale-105 disabled:opacity-0 sm:flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {pages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goto(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === page ? 22 : 8,
                background: i === page ? "var(--primary)" : "var(--line)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
