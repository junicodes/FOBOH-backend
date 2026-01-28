import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import * as schema from "../db/schema";

type SqliteDb = ReturnType<typeof drizzleSqlite<typeof schema>>;
type LibsqlDb = ReturnType<typeof drizzleLibsql<typeof schema>>;

let sqlite: Database.Database | null = null;
let db: SqliteDb | LibsqlDb | null = null;

/**
 * Get database instance
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

/**
 * Database initialization
 * DEV: local SQLite file using better-sqlite3
 * PROD: Turso/libsql using @libsql/client
 */
export async function initDb() {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && process.env.TURSO_DATABASE_URL) {
    // Production: use Turso / libsql
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    db = drizzleLibsql(client, { schema });
    console.log("✅ Connected to Turso (libsql) database for production");
  } else {
    // Development / local: use file-based SQLite
    const dbPath = process.env.DATABASE_PATH || "sqlite.db";
    sqlite = new Database(dbPath);
    db = drizzleSqlite({ client: sqlite, schema });
    console.log(`✅ Local SQLite database initialized (${dbPath})`);
  }

  return db;
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}