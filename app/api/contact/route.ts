import type { NextRequest } from "next/server";
import { isContactConfigured, parseContact, sendContact } from "@/lib/server/contact";
import { BodyTooLarge, isSameOrigin, rateLimit, readBody, requestMime } from "@/lib/server/request";
import { websiteApiDenial } from "@/lib/server/website-access";

export const runtime = "nodejs";

function failure(status: number, message: string, fieldErrors?: Record<string, string>, retryAfter?: number) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (retryAfter) headers.set("Retry-After", String(retryAfter));
  return Response.json({ ok: false, message, fieldErrors }, { status, headers });
}

export async function POST(request: NextRequest) {
  const denied = await websiteApiDenial(request);
  if (denied) return denied;
  if (!isContactConfigured()) return failure(503, "Der Kontaktversand ist derzeit nicht eingerichtet.");
  if (!isSameOrigin(request)) return failure(403, "Diese Anfrage ist nicht zulässig.");
  if (requestMime(request) !== "application/json") return failure(415, "Dieses Datenformat wird nicht unterstützt.");

  const retryAfter = rateLimit(request, "contact", 5, 10 * 60);
  if (retryAfter) return failure(429, "Zu viele Anfragen. Bitte versuche es später erneut.", undefined, retryAfter);

  let input: unknown;
  try {
    const bytes = await readBody(request, 24 * 1024);
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof BodyTooLarge) return failure(413, "Die Anfrage ist zu groß.");
    return failure(400, "Die Anfrage konnte nicht gelesen werden.");
  }

  const { data, fieldErrors, honeypot } = parseContact(input);
  if (honeypot) return failure(400, "Das Formular konnte nicht verarbeitet werden.");
  if (Object.keys(fieldErrors).length) return failure(422, "Überprüfe die markierten Felder.", fieldErrors);

  try {
    if (await sendContact(data)) return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Relay failures are surfaced to the sender without exposing connection details or message contents.
  }
  return failure(502, "Deine Nachricht konnte gerade nicht übermittelt werden. Bitte versuche es erneut.");
}
