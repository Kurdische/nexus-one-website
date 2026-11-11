import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { database } from "./database";

const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function configuredOrigin(): string | null {
  const value = process.env.NEXUS_SITE_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    const secureOrLocal = url.protocol === "https:" || (url.protocol === "http:" && loopback.has(url.hostname));
    return secureOrLocal && url.pathname === "/" && !url.username && !url.password && !url.search && !url.hash
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function allowsLocalOrigin(): boolean {
  return !process.env.NEXUS_SITE_URL;
}

export function requestOrigin(request: Request): string | null {
  const canonical = configuredOrigin();
  if (canonical || !allowsLocalOrigin()) return canonical;

  const host = request.headers.get("host");
  if (!host || !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)) return null;
  try {
    return new URL(`http://${host}`).origin;
  } catch {
    return null;
  }
}

export function isSameOrigin(request: Request): boolean {
  const target = requestOrigin(request);
  return Boolean(target && request.headers.get("origin") === target && request.headers.get("sec-fetch-site") !== "cross-site");
}

export class BodyTooLarge extends Error {}

export function requestMime(request: Request): string | undefined {
  return request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
}

export async function readBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) throw new BodyTooLarge();
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel().catch(() => {});
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function readForm(request: Request, limit: number): Promise<FormData> {
  const body = await readBody(request, limit);
  return new Response(body, { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
}

export function validEmail(email: string): boolean {
  return email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email);
}

function clientIdentity(request: Request): string | null {
  const trustedHeader = process.env.NEXUS_CLIENT_IP_HEADER?.toLowerCase();
  if (!trustedHeader || !/^[a-z0-9-]+$/.test(trustedHeader)) return null;
  const value = request.headers.get(trustedHeader)?.trim();
  return value && isIP(value) ? createHash("sha256").update(value).digest("hex") : null;
}

function consumeLimit(scope: string, identity: string, max: number, seconds: number): number {
  const db = database();
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / seconds) * seconds;
  db.prepare("DELETE FROM rate_limits WHERE window < ?").run(now - 24 * 60 * 60);
  const row = db.prepare(`
    INSERT INTO rate_limits (scope, identity, window, attempts) VALUES (?, ?, ?, 1)
    ON CONFLICT(scope, identity, window) DO UPDATE SET attempts = MIN(rate_limits.attempts + 1, ?)
    RETURNING attempts
  `).get(scope, identity, window, max + 1) as { attempts: number };
  return row.attempts > max ? window + seconds - now : 0;
}

export function rateLimit(request: Request, scope: string, max: number, seconds: number): number {
  const identity = clientIdentity(request);
  if (!identity) return consumeLimit(scope, "shared", max, seconds);
  return consumeLimit(scope, "global", max * 10, seconds) || consumeLimit(scope, identity, max, seconds);
}
