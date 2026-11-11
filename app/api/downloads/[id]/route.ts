import type { NextRequest } from "next/server";
import { getDownload } from "@/lib/server/content";
import { privateCacheControl, websiteApiDenial } from "@/lib/server/website-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await websiteApiDenial(request, true);
  if (denied) return denied;
  const { id } = await params;
  const download = idPattern.test(id) ? getDownload(id) : undefined;
  if (!download) return new Response("Download nicht verfügbar.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(download.data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${download.fileName}"`,
      "Content-Length": String(download.size),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": privateCacheControl,
    },
  });
}
