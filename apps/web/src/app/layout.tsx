import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { getCurrentBusiness } from "@/lib/tenant";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

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
// row (businesses.branding) re-skins the entire storefront.
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const business = await getCurrentBusiness();
  const themeVars = {
    "--accent": business?.branding.accent ?? "#d8a24a",
    "--primary": business?.branding.primary ?? "#161613",
  } as CSSProperties;

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body style={themeVars}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
