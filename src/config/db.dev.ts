import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../db/schemas/dev.schema";
import { config } from "./env";

let sqlite: Database.Database | null = null;
let db: any;

/**
 * Development database (SQLite via better-sqlite3)
 */
export async function initDb() {
  if (!sqlite) {
    const dbPath = config.databasePath || "sqlite.db";
    sqlite = new Database(dbPath);
    db = drizzle({ client: sqlite, schema });
    console.log(`✅ Local SQLite database initialized (${dbPath})`);
  }
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  // We intentionally return `any` here so callers can query any columns they need
  return db as any;
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

