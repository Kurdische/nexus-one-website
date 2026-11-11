import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/server/request";
import {
  accessPagePath, checkWebsiteSession, hasWebsiteCookie, isLocalAccessBypass, pendingWebsiteCookie,
  privateCacheControl, safeWebsiteDestination, validPendingWebsiteToken, websiteAccessPath, websiteCookie,
} from "@/lib/server/website-access";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const admin = pathname === "/admin";
  const login = pathname === accessPagePath;
  const bypass = isLocalAccessBypass(request.headers.get("host"));
  const protect = !admin && !login && !bypass;
  const destination = safeWebsiteDestination(pathname + request.nextUrl.search);
  const origin = requestOrigin(request);
  const cookie = websiteCookie(origin);
  const pending = pendingWebsiteCookie(origin);
  const pendingToken = request.cookies.get(pending.name)?.value;
  if (login && request.method === "GET" && !bypass && origin) {
    const next = safeWebsiteDestination(request.nextUrl.searchParams.get("next"));
    const current = await checkWebsiteSession(request.cookies.get(cookie.name)?.value);
    if (current.status === "valid") {
      const response = NextResponse.redirect(new URL(next, origin), {
        status: 307,
        headers: { "Cache-Control": privateCacheControl, "X-Robots-Tag": "noindex, nofollow" },
      });
      response.cookies.set(pending.name, "", { ...pending.options, maxAge: 0 });
      return response;
    }
    if (validPendingWebsiteToken(pendingToken)) {
      const recovered = await checkWebsiteSession(pendingToken);
      if (recovered.status === "valid") {
        const response = NextResponse.redirect(new URL(next, origin), {
          status: 307,
          headers: { "Cache-Control": privateCacheControl, "X-Robots-Tag": "noindex, nofollow" },
        });
        response.cookies.set(cookie.name, pendingToken, { ...cookie.options, expires: new Date(recovered.expiresAt) });
        response.cookies.set(pending.name, "", { ...pending.options, maxAge: 0 });
        return response;
      }
    }
  }
  if (protect && !hasWebsiteCookie(request.cookies.get(cookie.name)?.value)) {
    const headers = { "Cache-Control": privateCacheControl, "X-Robots-Tag": "noindex, nofollow" };
    if (!origin) return new NextResponse("Website-Zugang ist nicht eingerichtet.", { status: 503, headers });
    return NextResponse.redirect(new URL(websiteAccessPath(destination), origin), {
      status: 307,
      headers,
    });
  }

  const nonce = randomBytes(24).toString("base64");
  const development = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", policy);
  headers.set("x-nexus-destination", destination);
  headers.set("x-nexus-access-view", login ? "login" : "site");

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  if (!bypass || admin || login) {
    response.headers.set("Cache-Control", privateCacheControl);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (login && request.method === "GET" && !bypass && !validPendingWebsiteToken(pendingToken)) {
    response.cookies.set(pending.name, randomBytes(32).toString("hex"), pending.options);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static/|_next/image$|_next/webpack-hmr$|favicon.ico$|icon.svg$|nexus-orbit.webp$|opengraph-image$|robots.txt$|sitemap.xml$).*)"],
};
