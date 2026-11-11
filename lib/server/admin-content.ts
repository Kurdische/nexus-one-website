import "server-only";

import { appStatusLabels, type AppStatus } from "@/lib/catalog";
import {
  addDownload, addScreenshot, downloadPlatforms, removeApp, removeDownload, removeScreenshot, removeUpdate,
  saveApp, saveUpdate, updateCategories, updateDownload, type DownloadPlatform,
} from "./content";

const mebibyte = 1024 * 1024;
export const downloadLimit = 64 * mebibyte;
export const screenshotLimit = 5 * mebibyte;
export const formLimit = 64 * 1024;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const adminViews = ["apps", "downloads", "screenshots", "updates"] as const;
export type AdminView = (typeof adminViews)[number];
export type AdminNotice = "saved" | "removed" | "invalid" | "unavailable" | "too-large";

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function matches<T extends string>(value: string, values: readonly T[]): value is T {
  return values.some((item) => item === value);
}

export function isAdminView(value: string): value is AdminView {
  return matches(value, adminViews);
}

function validText(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max && !value.includes("\0");
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function validLines(values: string[]): boolean {
  return values.length <= 12 && values.every((item) => validText(item, 1, 180));
}

function validSlug(value: string): boolean {
  return value.length <= 48 && slugPattern.test(value);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function fileField(form: FormData): File | null {
  const value = form.get("file");
  return value instanceof File && value.size > 0 ? value : null;
}

function hasBytes(bytes: Uint8Array, offset: number, signature: readonly number[]): boolean {
  return offset >= 0 && signature.every((value, index) => bytes[offset + index] === value);
}

function isZip(bytes: Uint8Array): boolean {
  if (!hasBytes(bytes, 0, [0x50, 0x4b, 3, 4])) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const first = Math.max(0, bytes.length - 65557);
  for (let offset = bytes.length - 22; offset >= first; offset--) {
    if (hasBytes(bytes, offset, [0x50, 0x4b, 5, 6]) && offset + 22 + view.getUint16(offset + 20, true) === bytes.length) {
      const centralOffset = view.getUint32(offset + 16, true);
      return centralOffset < offset && hasBytes(bytes, centralOffset, [0x50, 0x4b, 1, 2]);
    }
  }
  return false;
}

function validPackage(platform: DownloadPlatform, extension: string, bytes: Uint8Array): boolean {
  if (platform === "Android") return extension === "apk" && isZip(bytes);
  if (platform === "iOS") return extension === "ipa" && isZip(bytes);
  if (platform === "Web") return extension === "zip" && isZip(bytes);
  if (extension === "zip") return isZip(bytes);
  if (extension === "msi") return hasBytes(bytes, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (extension === "exe" && bytes.length >= 64 && hasBytes(bytes, 0, [0x4d, 0x5a])) {
    const offset = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(60, true);
    return hasBytes(bytes, offset, [0x50, 0x45, 0, 0]);
  }
  return false;
}

function imageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 33 && hasBytes(bytes, 0, [137, 80, 78, 71, 13, 10, 26, 10]) &&
      hasBytes(bytes, 12, [0x49, 0x48, 0x44, 0x52]) && hasBytes(bytes, bytes.length - 8, [0x49, 0x45, 0x4e, 0x44])) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return width > 0 && height > 0 && width <= 8192 && height <= 8192 ? "image/png" : null;
  }
  if (bytes.length >= 16 && hasBytes(bytes, 0, [0xff, 0xd8, 0xff]) &&
      hasBytes(bytes, bytes.length - 2, [0xff, 0xd9])) return "image/jpeg";
  if (bytes.length >= 20 && hasBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
      hasBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38])) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getUint32(4, true) + 8 === bytes.length ? "image/webp" : null;
  }
  return null;
}

function appMutation(form: FormData, operation: string): AdminNotice {
  const slug = field(form, "slug");
  if (!validSlug(slug)) return "invalid";
  if (operation === "remove") return removeApp(slug) ? "removed" : "unavailable";
  if (operation !== "create" && operation !== "edit") return "invalid";

  const name = field(form, "name");
  const description = field(form, "description");
  const category = field(form, "category");
  const accent = field(form, "accent");
  const icon = field(form, "icon");
  const status = field(form, "status");
  const tagline = field(form, "tagline") || description;
  const overview = field(form, "overview") || description;
  const focus = lines(field(form, "focus"));
  const features = lines(field(form, "features"));
  const benefits = lines(field(form, "benefits"));
  if (!validText(name, 2, 80) || !validText(description, 5, 240) || !validText(category, 2, 80) ||
      !/^#[0-9a-f]{6}$/i.test(accent) || !/^[a-zA-Z][a-zA-Z0-9-]{0,39}$/.test(icon) ||
      !Object.hasOwn(appStatusLabels, status) || !validText(tagline, 5, 240) || !validText(overview, 5, 2000) ||
      ![focus, features, benefits].every(validLines)) return "invalid";

  return saveApp({ slug, name, description, category, accent, icon, status: status as AppStatus, tagline, overview, focus, features, benefits },
    operation === "create") ? "saved" : "unavailable";
}

async function downloadMutation(form: FormData, operation: string): Promise<AdminNotice> {
  const id = field(form, "id");
  if (operation === "remove") return idPattern.test(id) && removeDownload(id) ? "removed" : "unavailable";

  const version = field(form, "version");
  const releasedAt = field(form, "releasedAt");
  const changelog = field(form, "changelog");
  if (!/^[a-z0-9][a-z0-9._+-]{0,39}$/i.test(version) || !validDate(releasedAt) ||
      !validText(changelog, 3, 4000)) return "invalid";
  if (operation === "edit") {
    return idPattern.test(id) && updateDownload(id, { version, releasedAt, changelog }) ? "saved" : "unavailable";
  }
  if (operation !== "create") return "invalid";

  const appSlug = field(form, "appSlug");
  const platform = field(form, "platform");
  const file = fileField(form);
  if (!validSlug(appSlug) || !matches(platform, downloadPlatforms) || !file) return "invalid";
  if (file.size > downloadLimit) return "too-large";

  const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
  const data = new Uint8Array(await file.arrayBuffer());
  if (!validPackage(platform, extension, data)) return "invalid";
  const base = file.name.slice(0, -(extension.length + 1)).normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  const fileName = `${base || appSlug}.${extension}`;
  return addDownload({ appSlug, platform, version, fileName, releasedAt, changelog }, data) ? "saved" : "unavailable";
}

async function screenshotMutation(form: FormData, operation: string): Promise<AdminNotice> {
  if (operation === "remove") {
    const id = field(form, "id");
    return idPattern.test(id) && removeScreenshot(id) ? "removed" : "unavailable";
  }
  if (operation !== "create") return "invalid";

  const appSlug = field(form, "appSlug");
  const alt = field(form, "alt");
  const file = fileField(form);
  if (!validSlug(appSlug) || !validText(alt, 3, 200) || !file) return "invalid";
  if (file.size > screenshotLimit) return "too-large";

  const data = new Uint8Array(await file.arrayBuffer());
  const mimeType = imageType(data);
  if (!mimeType) return "invalid";
  return addScreenshot(appSlug, alt, mimeType, data) ? "saved" : "unavailable";
}

function updateMutation(form: FormData, operation: string): AdminNotice {
  const id = field(form, "id");
  if (operation === "remove") return idPattern.test(id) && removeUpdate(id) ? "removed" : "unavailable";
  if (operation !== "create" && !(operation === "edit" && idPattern.test(id))) return "invalid";

  const title = field(form, "title");
  const category = field(form, "category");
  const body = field(form, "body");
  const publishedAt = field(form, "publishedAt");
  const appSlug = field(form, "appSlug") || null;
  if (!validText(title, 3, 140) || !validText(body, 5, 8000) || !matches(category, updateCategories) ||
      !validDate(publishedAt) || (appSlug && !validSlug(appSlug))) return "invalid";

  return saveUpdate({ title, category, body, publishedAt, appSlug }, operation === "edit" ? id : undefined)
    ? "saved" : "unavailable";
}

export function mutateContent(view: AdminView, form: FormData) {
  const operation = field(form, "operation");
  switch (view) {
    case "apps": return appMutation(form, operation);
    case "downloads": return downloadMutation(form, operation);
    case "screenshots": return screenshotMutation(form, operation);
    case "updates": return updateMutation(form, operation);
  }
}

export function adminBodyLimit(view: AdminView): number {
  if (view === "downloads") return downloadLimit + formLimit;
  if (view === "screenshots") return screenshotLimit + formLimit;
  return formLimit;
}
