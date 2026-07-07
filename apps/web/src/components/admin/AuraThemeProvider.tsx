"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

// Drives the Command Center's "Aura" toggle (Midnight ⇄ Studio) via a class on
// <html>. Mounted at the root so next-themes' inline script prevents a
// theme flash, but the storefront defines no `dark:` styles, so the class is
// inert there — only the /admin surface reacts. Default is dark (Midnight).
export function AuraThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="zenith-admin-aura"
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
