import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookie, getAdminSession } from "./auth";
import { configuredOrigin, requestOrigin } from "./request";

export const websiteProduct = "nexus_one_web";
export const accessPagePath = "/zugang";
export const privateCacheControl = "private, no-store, max-age=0";

const defaultWorker = "https://lingoflow-worker.stevansabahhakari.workers.dev";
const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]);
const tokenPattern = /^[A-Za-z0-9._~-]{16,2048}$/;
const requestTokenPattern = /^[a-f0-9]{64}$/;
const websitePaths = new Set(["/", "/apps", "/downloads", "/kontakt", "/oekosystem", "/ueber-uns", "/updates"]);

type AccessFailure = { status: "invalid" | "limited" | "unavailable" };
type ValidSession = { status: "valid"; expiresAt: number };
type NewSession = ValidSession & { token: string };

function workerEndpoint(path: string): URL | null {
  try {
    const origin = new URL(process.env.NEXUS_ACCESS_WORKER_URL || defaultWorker);
    const validProtocol = origin.protocol === "https:" || (origin.protocol === "http:" && loopback.has(origin.hostname));
    if (!validProtocol || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
    return new URL(path, origin);
  } catch {
    return null;
  }
}

export function isLocalAccessBypass(host: string | null): boolean {
  if (process.env.NEXUS_ACCESS_LOCAL_BYPASS !== "true") return false;
  const origin = configuredOrigin();
  return Boolean(origin?.startsWith("http:") && host?.toLowerCase() === new URL(origin).host);
}

export function websiteCookie(origin: string | null) {
  const secure = !origin?.startsWith("http:");
  return {
    name: secure ? "__Host-nexus_one_access" : "nexus_one_access",
    options: { httpOnly: true, secure, sameSite: "strict" as const, path: "/" },
  };
}

export function pendingWebsiteCookie(origin: string | null) {
  const cookie = websiteCookie(origin);
  return {
    name: cookie.options.secure ? "__Host-nexus_one_pending" : "nexus_one_pending",
    options: { ...cookie.options, maxAge: 30 * 24 * 60 * 60 },
  };
}

export function validPendingWebsiteToken(value?: string): value is string {
  return Boolean(value && requestTokenPattern.test(value));
}

export function safeWebsiteDestination(value: unknown): string {
  if (typeof value !== "string" || value.length > 512 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  const base = "https://nexus.invalid";
  const destination = new URL(value, base);
  const { pathname } = destination;
  if (destination.origin !== base || (!websitePaths.has(pathname) && !/^\/apps\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname))) return "/";
  const filter = destination.searchParams.get("filter");
  if ((pathname === "/downloads" || pathname === "/updates") && filter && /^[a-zA-Z0-9_-]{1,32}$/.test(filter)) {
    return `${pathname}?${new URLSearchParams({ filter })}`;
  }
  return pathname;
}

export function websiteAccessPath(destination?: string, notice?: AccessFailure["status"]): string {
  const query = new URLSearchParams();
  if (destination && destination !== "/") query.set("next", destination);
  if (notice) query.set("notice", notice);
  return query.size ? `${accessPagePath}?${query}` : accessPagePath;
}

async function accessWorker(path: string, request: RequestInit) {
  const endpoint = workerEndpoint(path);
  if (!endpoint) return { status: "unavailable" } as const;

  try {
    const response = await fetch(endpoint, {
      ...request,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401 || response.status === 400 || response.status === 403) return { status: "invalid" } as const;
    if (response.status === 429) return { status: "limited" } as const;
    if (response.status !== 200) return { status: "unavailable" } as const;
    const value: unknown = await response.json();
    if (!value || typeof value !== "object") return { status: "unavailable" } as const;
    const data = value as Record<string, unknown>;
    const expiresAt = typeof data.expiresAt === "string" ? Date.parse(data.expiresAt) : Number.NaN;
    if (data.valid !== true || data.product !== websiteProduct || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return { status: "invalid" } as const;
    }
    return { status: "valid", expiresAt, token: data.session } as const;
  } catch {
    return { status: "unavailable" } as const;
  }
}

export async function checkWebsiteSession(token?: string): Promise<ValidSession | AccessFailure> {
  if (!token || !tokenPattern.test(token)) return { status: "invalid" };
  return accessWorker(`/api/access/session?product=${websiteProduct}`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
}

export async function redeemWebsiteCode(code: string, requestToken: string): Promise<NewSession | AccessFailure> {
  if (!validPendingWebsiteToken(requestToken)) return { status: "invalid" };
  const result = await accessWorker("/api/access/verify", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ code, product: websiteProduct, requestToken }),
  });
  if (result.status !== "valid") return result;
  if (result.token !== requestToken) return { status: "unavailable" };
  return { ...result, token: result.token };
}

export function hasWebsiteCookie(token?: string): boolean {
  return Boolean(token && tokenPattern.test(token));
}

export const requireWebsitePage = cache(async function requireWebsitePage() {
  const requestHeaders = await headers();
  if (isLocalAccessBypass(requestHeaders.get("host"))) return;
  const request = new Request("http://nexus.internal", { headers: requestHeaders });
  const token = (await cookies()).get(websiteCookie(requestOrigin(request)).name)?.value;
  const session = await checkWebsiteSession(token);
  if (session.status === "valid") return;
  redirect(websiteAccessPath(safeWebsiteDestination(requestHeaders.get("x-nexus-destination")), session.status));
});

export async function websiteApiDenial(
  request: Request & { cookies: { get(name: string): { value: string } | undefined } },
  allowEditorialAdmin = false,
): Promise<Response | null> {
  if (isLocalAccessBypass(request.headers.get("host"))) return null;
  if (allowEditorialAdmin && getAdminSession(request.cookies.get(adminCookie().name)?.value)?.role === "admin") return null;

  const session = await checkWebsiteSession(request.cookies.get(websiteCookie(requestOrigin(request)).name)?.value);
  if (session.status === "valid") return null;
  const status = { invalid: 401, limited: 429, unavailable: 503 }[session.status];
  return Response.json({ ok: false, message: "Der Zugang konnte nicht bestätigt werden." }, {
    status,
    headers: { "Cache-Control": privateCacheControl, "X-Robots-Tag": "noindex, nofollow" },
  });
}
