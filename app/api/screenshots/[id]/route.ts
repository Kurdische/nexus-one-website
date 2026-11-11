import type { NextRequest } from "next/server";
import { getScreenshot } from "@/lib/server/content";
import { privateCacheControl, websiteApiDenial } from "@/lib/server/website-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await websiteApiDenial(request, true);
  if (denied) return denied;
  const { id } = await params;
  const screenshot = idPattern.test(id) ? getScreenshot(id) : undefined;
  if (!screenshot) return new Response("Screenshot nicht verfügbar.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(screenshot.data, {
    headers: {
      "Content-Type": screenshot.mimeType,
      "Content-Length": String(screenshot.data.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": privateCacheControl,
    },
  });
}
