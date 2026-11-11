import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import { Brand } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteDescription, siteName, siteUrl } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: `${siteName} – Your Digital Ecosystem`, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
};

export const viewport: Viewport = { themeColor: "#080810", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const accessView = (await headers()).get("x-nexus-access-view") === "login";

  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
        {accessView ? <header className="site-header"><div className="site-container header-inner"><Brand /></div></header> : <SiteHeader />}
        <main id="main-content" tabIndex={-1}>{children}</main>
        {!accessView && <SiteFooter />}
      </body>
    </html>
  );
}
