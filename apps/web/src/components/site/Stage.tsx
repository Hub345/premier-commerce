"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export interface StageProps {
  /** Changes per category so Framer Motion replays the "scene change". */
  sceneKey: string;
  kicker: string;
  headline: string;
  ctaHref: string;
  ctaLabel: string;
  bg?: string | null;
  imageUrl?: string | null;
  /** Flagship product name, shown on the fallback plinth. */
  flagship?: string | null;
}

const DEFAULT_BG = "linear-gradient(180deg,#FBFAF7,#F1EEE8)";

export function Stage({
  sceneKey,
  kicker,
  headline,
  ctaHref,
  ctaLabel,
  bg,
  imageUrl,
  flagship,
}: StageProps) {
  const initials = (flagship ?? kicker)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <section
      className="relative overflow-hidden border-b border-line"
      style={{ background: bg || DEFAULT_BG }}
    >
      <div className="mx-auto grid min-h-[58vh] max-w-6xl items-center gap-8 px-6 py-16 lg:grid-cols-2">
        <motion.div
          key={`${sceneKey}-text`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
            {kicker}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-bold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-[5rem]">
            {headline}
          </h1>
          <Link
            href={ctaHref}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            {ctaLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        <motion.div
          key={`${sceneKey}-image`}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
          className="relative hidden items-center justify-center lg:flex"
        >
          {/* Spotlight */}
          <div
            className="absolute h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--accent)" }}
          />
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="relative z-10 max-h-[44vh] w-auto object-contain"
              style={{ filter: "drop-shadow(0 30px 45px rgba(20,20,15,0.28))" }}
            />
          ) : (
            <div className="relative z-10 flex h-72 w-72 flex-col items-center justify-center rounded-[2.2rem] border border-white/70 bg-white/55 shadow-soft backdrop-blur-sm">
              <span className="font-mono text-7xl text-ink/10">{initials}</span>
              {flagship ? (
                <span className="mt-2 max-w-[12rem] text-center text-sm font-medium text-ink/60">
                  {flagship}
                </span>
              ) : null}
            </div>
          )}
          {/* Stage floor shadow */}
          <div className="absolute bottom-8 h-5 w-52 rounded-[50%] bg-ink/15 blur-xl" />
        </motion.div>
      </div>
    </section>
  );
}
