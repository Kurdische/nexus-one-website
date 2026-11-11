import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/metadata";
import { listApps } from "@/lib/server/content";
import { isLocalAccessBypass } from "@/lib/server/website-access";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isLocalAccessBypass((await headers()).get("host"))) return [];
  const paths = ["/", "/apps", "/oekosystem", "/updates", "/ueber-uns", "/kontakt", "/downloads", ...listApps().map(({ slug }) => `/apps/${slug}`)];
  return paths.map((path) => ({ url: new URL(path, siteUrl).href }));
}
