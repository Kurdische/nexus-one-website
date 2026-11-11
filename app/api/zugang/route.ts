import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin, readForm, requestMime, requestOrigin } from "@/lib/server/request";
import {
  checkWebsiteSession, isLocalAccessBypass, pendingWebsiteCookie, privateCacheControl, redeemWebsiteCode,
  safeWebsiteDestination, validPendingWebsiteToken, websiteAccessPath, websiteCookie,
} from "@/lib/server/website-access";

export const runtime = "nodejs";

const privateHeaders = { "Cache-Control": privateCacheControl, "X-Robots-Tag": "noindex, nofollow" };

export async function POST(request: NextRequest) {
  const origin = requestOrigin(request);
  if (!origin || !isSameOrigin(request)) return new Response("Unzulässige Anfrage.", { status: 403, headers: privateHeaders });
  if (requestMime(request) !== "application/x-www-form-urlencoded") {
    return new Response("Ungültiges Formularformat.", { status: 415, headers: privateHeaders });
  }

  const goTo = (path: string) => NextResponse.redirect(new URL(path, origin), { status: 303, headers: privateHeaders });
  let form: FormData;
  try {
    form = await readForm(request, 4096);
  } catch {
    return goTo(websiteAccessPath("/", "invalid"));
  }

  const next = safeWebsiteDestination(form.get("next"));
  if (isLocalAccessBypass(request.headers.get("host"))) return goTo(next);
  const cookie = websiteCookie(origin);
  const existing = await checkWebsiteSession(request.cookies.get(cookie.name)?.value);
  if (existing.status === "valid") return goTo(next);
  if (existing.status !== "invalid") return goTo(websiteAccessPath(next, existing.status));

  const pending = pendingWebsiteCookie(origin);
  const requestToken = request.cookies.get(pending.name)?.value;
  if (!validPendingWebsiteToken(requestToken)) return goTo(websiteAccessPath(next));
  const completeSession = (token: string, expiresAt: number) => {
    const response = goTo(next);
    response.cookies.set(cookie.name, token, { ...cookie.options, expires: new Date(expiresAt) });
    response.cookies.set(pending.name, "", { ...pending.options, maxAge: 0 });
    return response;
  };
  const recovered = await checkWebsiteSession(requestToken);
  if (recovered.status === "valid") return completeSession(requestToken, recovered.expiresAt);
  if (recovered.status !== "invalid") return goTo(websiteAccessPath(next, recovered.status));

  const submitted = form.get("code");
  const code = typeof submitted === "string" ? submitted.trim() : "";
  if (!code || code.length > 160 || /[\x00-\x1f\x7f]/.test(code)) return goTo(websiteAccessPath(next, "invalid"));

  const session = await redeemWebsiteCode(code, requestToken);
  if (session.status !== "valid") {
    if (session.status !== "invalid") return goTo(websiteAccessPath(next, session.status));
    const latest = await checkWebsiteSession(requestToken);
    if (latest.status === "valid") return completeSession(requestToken, latest.expiresAt);
    const response = goTo(websiteAccessPath(next, latest.status));
    if (latest.status === "invalid") response.cookies.set(pending.name, "", { ...pending.options, maxAge: 0 });
    return response;
  }
  return completeSession(session.token, session.expiresAt);
}
