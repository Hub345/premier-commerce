"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@premier/protocol";
import type { CategoryHero, CategoryRef } from "@/lib/catalog";

const DEFAULT_BG = "linear-gradient(160deg,#F1EEE8,#FBFAF7)";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return <span className="font-mono text-4xl text-ink/15">{initials}</span>;
}

function ProductTile({
  product,
  size,
}: {
  product: Product;
  size: "hero" | "support";
}) {
  const image = product.images[0] ?? product.variants[0]?.images[0] ?? null;
  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-line/70 bg-white/40 p-5 transition-transform duration-300 hover:-translate-y-1 ${
        size === "hero" ? "h-full min-h-[26rem]" : "min-h-[13rem]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <Initials name={product.name} />
        )}
      </div>
      <div className="relative z-10">
        <p
          className={`font-medium text-ink ${size === "hero" ? "text-xl" : "text-sm"}`}
        >
          {product.name}
        </p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-soft opacity-0 transition-opacity group-hover:opacity-100">
          Discover
          <span aria-hidden style={{ color: "var(--accent)" }}>
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}

export function CategoryStage({
  category,
  hero,
  products,
}: {
  category: CategoryRef;
  hero: CategoryHero;
  products: Product[];
}) {
  const [heroProduct, ...supporting] = products;
  if (!heroProduct) return null;

  return (
    <motion.section
      id={`shop-${category.slug}`}
      className="scroll-mt-40 rounded-[2.5rem] border border-line p-6 sm:p-8"
      style={{ background: hero.bg || DEFAULT_BG }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
            {hero.kicker ?? category.name}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {hero.headline ?? category.name}
          </h2>
        </div>
        <Link
          href={`/category/${category.slug}`}
          className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-surface/70 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface sm:inline-flex"
        >
          Discover {category.name}
          <span aria-hidden>&rarr;</span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProductTile product={heroProduct} size="hero" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {supporting.slice(0, 4).map((p) => (
            <ProductTile key={p.id} product={p} size="support" />
          ))}
        </div>
      </div>

      <Link
        href={`/category/${category.slug}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink sm:hidden"
      >
        Discover {category.name}
        <span aria-hidden>&rarr;</span>
      </Link>
    </motion.section>
  );
}
