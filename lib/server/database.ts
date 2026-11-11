import "server-only";

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const runtime = globalThis as typeof globalThis & {
  nexusDatabase?: DatabaseSync;
};

export function database(): DatabaseSync {
  if (runtime.nexusDatabase) return runtime.nexusDatabase;

  const directory = resolve(/*turbopackIgnore: true*/ process.env.NEXUS_DATA_DIR || ".nexus-data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });

  const db = new DatabaseSync(resolve(directory, "nexus.sqlite"));
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS apps (
      slug TEXT PRIMARY KEY,
      content TEXT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      app_slug TEXT NOT NULL,
      platform TEXT NOT NULL,
      version TEXT NOT NULL,
      file_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      released_at TEXT NOT NULL,
      changelog TEXT NOT NULL,
      data BLOB NOT NULL,
      UNIQUE (app_slug, platform, version)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      app_slug TEXT NOT NULL,
      alt TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data BLOB NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      body TEXT NOT NULL,
      published_at TEXT NOT NULL,
      app_slug TEXT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS rate_limits (
      scope TEXT NOT NULL,
      identity TEXT NOT NULL,
      window INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      PRIMARY KEY (scope, identity, window)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS screenshots_app ON screenshots (app_slug, created_at);
    CREATE INDEX IF NOT EXISTS updates_date ON updates (published_at);
  `);
  runtime.nexusDatabase = db;
  return db;
}

export function transaction<T>(callback: (db: DatabaseSync) => T): T {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
