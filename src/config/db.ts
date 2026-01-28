import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../db/schema";

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle> | null = null;

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
 * Creates local SQLite database file using better-sqlite3
 * Runs migrations automatically on startup
 */
export async function initDb() {
  // Create local SQLite database file
  sqlite = new Database("sqlite.db");
  
  // Initialize Drizzle following the pattern: drizzle({ client: sqlite })
  db = drizzle({ client: sqlite, schema });

  console.log("✅ Local SQLite database initialized (sqlite.db)");
  return db;
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}