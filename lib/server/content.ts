import "server-only";

import { randomUUID } from "node:crypto";
import { catalogApps, getCatalogApp, type CatalogApp } from "@/lib/catalog";
import { database, transaction } from "./database";

export type AppRecord = CatalogApp;

export const downloadPlatforms = ["Windows", "Android", "iOS", "Web"] as const;
export const updateCategories = ["app", "feature", "update", "fix", "announcement"] as const;

export type DownloadPlatform = (typeof downloadPlatforms)[number];
export type UpdateCategory = (typeof updateCategories)[number];

export type DownloadRecord = {
  id: string;
  appSlug: string;
  platform: DownloadPlatform;
  version: string;
  fileName: string;
  size: number;
  releasedAt: string;
  changelog: string;
  href: string;
};

export type ScreenshotRecord = {
  id: string;
  appSlug: string;
  alt: string;
  href: string;
};

export type UpdateRecord = {
  id: string;
  title: string;
  category: UpdateCategory;
  body: string;
  publishedAt: string;
  appSlug: string | null;
};

type StoredDownload = Omit<DownloadRecord, "href">;
type StoredScreenshot = Omit<ScreenshotRecord, "href">;

export function listApps(): AppRecord[] {
  const apps = new Map(catalogApps.map((app) => [app.slug, app]));
  const rows = database().prepare("SELECT slug, content FROM apps ORDER BY rowid").all() as {
    slug: string;
    content: string | null;
  }[];

  for (const { slug, content } of rows) {
    if (content === null) apps.delete(slug);
    else apps.set(slug, JSON.parse(content) as AppRecord);
  }
  return [...apps.values()];
}

export function getApp(slug: string): AppRecord | null {
  const row = database().prepare("SELECT content FROM apps WHERE slug = ?").get(slug) as
    | { content: string | null }
    | undefined;
  if (!row) return getCatalogApp(slug) ?? null;
  return row.content === null ? null : JSON.parse(row.content) as AppRecord;
}

export function saveApp(app: AppRecord, isNew: boolean): boolean {
  return transaction((db) => {
    if (Boolean(getApp(app.slug)) === isNew) return false;
    db.prepare(`
      INSERT INTO apps (slug, content) VALUES (?, ?)
      ON CONFLICT(slug) DO UPDATE SET content = excluded.content
    `).run(app.slug, JSON.stringify(app));
    return true;
  });
}

export function removeApp(slug: string): boolean {
  return transaction((db) => {
    if (!getApp(slug)) return false;
    db.prepare("DELETE FROM downloads WHERE app_slug = ?").run(slug);
    db.prepare("DELETE FROM screenshots WHERE app_slug = ?").run(slug);
    db.prepare("UPDATE updates SET app_slug = NULL WHERE app_slug = ?").run(slug);
    db.prepare(`
      INSERT INTO apps (slug, content) VALUES (?, NULL)
      ON CONFLICT(slug) DO UPDATE SET content = NULL
    `).run(slug);
    return true;
  });
}

export function listDownloads(slug?: string): DownloadRecord[] {
  const select = `
    SELECT id, app_slug AS appSlug, platform, version, file_name AS fileName, size,
      released_at AS releasedAt, changelog FROM downloads
  `;
  const order = " ORDER BY released_at DESC, rowid DESC";
  const db = database();
  const rows = (slug
    ? db.prepare(select + " WHERE app_slug = ?" + order).all(slug)
    : db.prepare(select + order).all()) as StoredDownload[];
  return rows.map((row) => ({ ...row, href: `/api/downloads/${row.id}` }));
}

export function getDownload(id: string) {
  return database().prepare("SELECT file_name AS fileName, size, data FROM downloads WHERE id = ?")
    .get(id) as { fileName: string; size: number; data: Uint8Array<ArrayBuffer> } | undefined;
}

export function addDownload(download: Omit<StoredDownload, "id" | "size">, data: Uint8Array): boolean {
  return transaction((db) => {
    if (!getApp(download.appSlug)) return false;
    const result = db.prepare(`
      INSERT INTO downloads (id, app_slug, platform, version, file_name, size, released_at, changelog, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(app_slug, platform, version) DO NOTHING
    `).run(randomUUID(), download.appSlug, download.platform, download.version, download.fileName,
      data.byteLength, download.releasedAt, download.changelog, data);
    return result.changes > 0;
  });
}

export function removeDownload(id: string): boolean {
  return database().prepare("DELETE FROM downloads WHERE id = ?").run(id).changes > 0;
}

export function updateDownload(
  id: string,
  { version, releasedAt, changelog }: Pick<DownloadRecord, "version" | "releasedAt" | "changelog">,
): boolean {
  return database().prepare(`
    UPDATE OR IGNORE downloads SET version = ?, released_at = ?, changelog = ? WHERE id = ?
  `).run(version, releasedAt, changelog, id).changes > 0;
}

export function listScreenshots(slug?: string): ScreenshotRecord[] {
  const select = "SELECT id, app_slug AS appSlug, alt FROM screenshots";
  const order = " ORDER BY created_at DESC, rowid DESC";
  const db = database();
  const rows = (slug
    ? db.prepare(select + " WHERE app_slug = ?" + order).all(slug)
    : db.prepare(select + order).all()) as StoredScreenshot[];
  return rows.map((row) => ({ ...row, href: `/api/screenshots/${row.id}` }));
}

export function getScreenshot(id: string) {
  return database().prepare("SELECT mime_type AS mimeType, data FROM screenshots WHERE id = ?")
    .get(id) as { mimeType: string; data: Uint8Array<ArrayBuffer> } | undefined;
}

export function addScreenshot(slug: string, alt: string, mimeType: string, data: Uint8Array): boolean {
  return transaction((db) => {
    if (!getApp(slug)) return false;
    db.prepare(`
      INSERT INTO screenshots (id, app_slug, alt, mime_type, created_at, data) VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), slug, alt, mimeType, new Date().toISOString(), data);
    return true;
  });
}

export function removeScreenshot(id: string): boolean {
  return database().prepare("DELETE FROM screenshots WHERE id = ?").run(id).changes > 0;
}

export function listUpdates(): UpdateRecord[] {
  return database().prepare(`
    SELECT id, title, category, body, published_at AS publishedAt, app_slug AS appSlug
    FROM updates ORDER BY published_at DESC, rowid DESC
  `).all() as UpdateRecord[];
}

export function saveUpdate(update: Omit<UpdateRecord, "id">, id?: string): boolean {
  return transaction((db) => {
    if (update.appSlug && !getApp(update.appSlug)) return false;
    if (id) {
      return db.prepare(`
        UPDATE updates SET title = ?, category = ?, body = ?, published_at = ?, app_slug = ? WHERE id = ?
      `).run(update.title, update.category, update.body, update.publishedAt, update.appSlug, id).changes > 0;
    }
    db.prepare(`
      INSERT INTO updates (id, title, category, body, published_at, app_slug) VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), update.title, update.category, update.body, update.publishedAt, update.appSlug);
    return true;
  });
}

export function removeUpdate(id: string): boolean {
  return database().prepare("DELETE FROM updates WHERE id = ?").run(id).changes > 0;
}
