import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/metadata";
import { isLocalAccessBypass } from "@/lib/server/website-access";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isLocalAccessBypass((await headers()).get("host"))) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
