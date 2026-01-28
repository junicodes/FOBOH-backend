import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schemas/prod.schema";
import { config } from "./env";

let pool: Pool | null = null;
let db: any;

/**
 * Production database (PostgreSQL via pg + drizzle-orm/node-postgres)
 */
export async function initDb() {
  if (!pool) {
    if (!config.database.url) {
      throw new Error("DATABASE_URL is not configured for production");
    }

    pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ca
        ? {
            ca: config.database.ca,
          }
        : undefined,
    });

    db = drizzle(pool, { schema });
    console.log("✅ Connected to PostgreSQL database for production");
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  // We intentionally return `any` here so services can select any columns they need
  return db as any;
}

export function closeDb() {
  if (pool) {
    pool.end();
    pool = null;
  }
  db = null;
}

