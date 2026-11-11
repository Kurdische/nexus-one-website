import type { Metadata } from "next";

export const siteName = "NEXUS ONE";
export const siteDescription = "Entdecke unsere digitalen Produkte. Von künstlicher Intelligenz über Produktivität bis hin zu Unterhaltung – alles in einem Ökosystem.";
export const siteUrl = new URL(process.env.NEXUS_SITE_URL || "http://127.0.0.1:3000");

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const socialTitle = path === "/" ? title : `${title} | ${siteName}`;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName,
      locale: "de_DE",
      title: socialTitle,
      description,
      url: path,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "NEXUS ONE – Your Digital Ecosystem" }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/opengraph-image"],
    },
  };
}
