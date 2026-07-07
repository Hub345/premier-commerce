"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// The high-fidelity Midnight ⇄ Studio switch. Renders a stable placeholder
// until mounted so the server/client markup matches (theme is only known
// client-side).
export function AuraToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle Midnight / Studio theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-8 w-14 items-center rounded-full border border-zinc-300 bg-zinc-200 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
    >
      <span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm transition-transform duration-300 dark:bg-zinc-950 dark:text-amber-300 ${
          isDark ? "translate-x-7" : "translate-x-1"
        }`}
      >
        {isDark ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
