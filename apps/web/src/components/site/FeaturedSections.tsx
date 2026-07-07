"use client";

import { useEffect, useRef, useState } from "react";
import type { FeaturedCategoryBlock } from "@/lib/catalog";
import { CategoryStage } from "@/components/site/CategoryStage";

export function FeaturedSections({
  blocks,
}: {
  blocks: FeaturedCategoryBlock[];
}) {
  const [active, setActive] = useState(blocks[0]?.category.slug ?? "");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    // A section is "current" once it crosses the middle band of the viewport —
    // this is what drives the sticky sub-nav highlight as the user scrolls.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute("data-slug");
            if (slug) setActive(slug);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );

    for (const el of sectionRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [blocks]);

  if (blocks.length === 0) return null;

  return (
    <div>
      {/* Sticky scroll-spy sub-nav: jump between featured categories without
          leaving the gallery. */}
      <div className="sticky top-24 z-20 -mx-6 mb-8 border-b border-line/70 bg-paper/90 px-6 py-3 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">
          {blocks.map((b) => (
            <a
              key={b.category.slug}
              href={`#shop-${b.category.slug}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active === b.category.slug
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {b.category.name}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-8">
        {blocks.map((b) => (
          <div
            key={b.category.slug}
            data-slug={b.category.slug}
            ref={(el) => {
              if (el) sectionRefs.current.set(b.category.slug, el);
              else sectionRefs.current.delete(b.category.slug);
            }}
          >
            <CategoryStage
              category={b.category}
              hero={b.hero}
              products={b.products}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
