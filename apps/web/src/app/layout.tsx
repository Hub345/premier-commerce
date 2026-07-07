import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { getCurrentBusiness } from "@/lib/tenant";
import { AuraThemeProvider } from "@/components/admin/AuraThemeProvider";

// A fixed, preloaded set the Stage Manager's Typography Switcher picks from —
// not an arbitrary font-family string (that would mean shipping every font
// on earth to every tenant).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const FONT_STACKS: Record<string, string> = {
  geist: "var(--font-geist-sans), sans-serif",
  inter: "var(--font-inter), sans-serif",
  playfair: "var(--font-playfair), serif",
};

export async function generateMetadata(): Promise<Metadata> {
  const business = await getCurrentBusiness();
  return {
    title: business ? business.name : "Premier Commerce",
    description:
      business?.branding.tagline ??
      "A multi-tenant commerce platform for the Kenyan market.",
  };
}

// The theme engine: the current tenant's colors are injected as CSS variables
// on <body>, server-side. No client HOC, no flash of unstyled color — one DB
// row (businesses.branding) re-skins the entire storefront. This root layout
// is deliberately bare (no header/footer) — the storefront route group adds
// those; /admin (the Command Center) does not, by design.
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const business = await getCurrentBusiness();
  const fontChoice = business?.branding.fontFamily ?? "geist";
  const themeVars = {
    "--accent": business?.branding.accent ?? "#d8a24a",
    "--primary": business?.branding.primary ?? "#161613",
    "--font-sans": FONT_STACKS[fontChoice] ?? FONT_STACKS.geist,
  } as CSSProperties;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable} ${playfair.variable}`}
    >
      <body style={themeVars}>
        <AuraThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </AuraThemeProvider>
      </body>
    </html>
  );
}
