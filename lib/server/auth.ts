import "server-only";

import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { database } from "./database";
import { allowsLocalOrigin, configuredOrigin, validEmail } from "./request";

const sessionSeconds = 8 * 60 * 60;
const keyPattern = /^[A-Za-z0-9_-]{43}$/;
const hashPattern = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{128})$/;
const scryptOptions = { N: 65536, r: 8, p: 2, maxmem: 96 * 1024 * 1024 };

function adminConfig() {
  const email = process.env.NEXUS_ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.NEXUS_ADMIN_PASSWORD_HASH;
  const secret = process.env.NEXUS_SESSION_SECRET;
  const parsed = passwordHash?.match(hashPattern);
  if (!email || !validEmail(email) || !parsed || !secret || !keyPattern.test(secret)) return null;
  if (!configuredOrigin() && !allowsLocalOrigin()) return null;

  const signingKey = createHmac("sha256", Buffer.from(secret, "base64url"))
    .update(`admin-session-v1\0${email}\0${passwordHash}`)
    .digest();
  return { email, salt: Buffer.from(parsed[1], "hex"), hash: Buffer.from(parsed[2], "hex"), signingKey };
}

export function isAdminConfigured(): boolean {
  return adminConfig() !== null;
}

export function adminCookie() {
  const secure = configuredOrigin()?.startsWith("https:") ?? false;
  return {
    name: secure ? "__Host-nexus_admin" : "nexus_admin",
    options: { httpOnly: true, secure, sameSite: "strict" as const, path: "/", maxAge: sessionSeconds },
  };
}

function equal(value: string, expected: string): boolean {
  const actual = Buffer.from(value);
  const reference = Buffer.from(expected);
  return actual.length === reference.length && timingSafeEqual(actual, reference);
}

export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  const config = adminConfig();
  if (!config || password.length < 12 || password.length > 256) return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, config.salt, 64, scryptOptions, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
  const passwordMatches = timingSafeEqual(derived, config.hash);
  return passwordMatches && equal(email.trim().toLowerCase(), config.email);
}

function sign(key: Buffer, label: string, id: string): string {
  return createHmac("sha256", key).update(label).update(id).digest("base64url");
}

function digest(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

export function createAdminSession(): string {
  const config = adminConfig();
  if (!config) throw new Error("Admin is not configured");

  const now = Math.floor(Date.now() / 1000);
  const id = randomBytes(32).toString("base64url");
  const db = database();
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").run(now);
  db.prepare("INSERT INTO admin_sessions (id_hash, expires_at) VALUES (?, ?)").run(digest(id), now + sessionSeconds);
  return `${id}.${sign(config.signingKey, "cookie:", id)}`;
}

export function getAdminSession(cookieValue?: string) {
  if (!cookieValue || cookieValue.length !== 87) return null;
  const config = adminConfig();
  if (!config) return null;

  const [id, signature] = cookieValue.split(".");
  if (!id || !signature || !keyPattern.test(id) || !keyPattern.test(signature) ||
      !equal(signature, sign(config.signingKey, "cookie:", id))) return null;

  const idHash = digest(id);
  const now = Math.floor(Date.now() / 1000);
  const valid = database().prepare("SELECT 1 FROM admin_sessions WHERE id_hash = ? AND expires_at > ?").get(idHash, now);
  return valid ? { idHash, role: "admin" as const, csrf: sign(config.signingKey, "csrf:", id) } : null;
}

export function validCsrf(value: FormDataEntryValue | null, expected: string): boolean {
  return typeof value === "string" && keyPattern.test(value) && equal(value, expected);
}

export function revokeAdminSession(idHash: string): void {
  database().prepare("DELETE FROM admin_sessions WHERE id_hash = ?").run(idHash);
}
