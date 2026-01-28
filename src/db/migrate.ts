import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import path from "path";
import { config } from "../config/env";
import * as devSchema from "./schemas/dev.schema";
import * as prodSchema from "./schemas/prod.schema";

const runMigrations = async () => {
  console.log("⏳ Running database migrations...");

  // Use different migration folders based on environment
  // Production: ./drizzle (PostgreSQL migrations)
  // Development: ./src/db/migrations (SQLite migrations)
  const migrationsPath =
    config.nodeEnv === "production"
      ? path.join(process.cwd(), "src/db/migrations/prod")
      : path.join(process.cwd(), "src/db/migrations/dev");

  // In production, if DATABASE_URL is set, run PostgreSQL migrations
  if (config.nodeEnv === "production" && config.database.url) {
    console.log("➡ Using PostgreSQL (production) for migrations");

    // Configure SSL for PostgreSQL connection
    const sslConfig = config.database.ca && config.database.ca.trim() !== ""
      ? {
          ca: config.database.ca.replace(/\\n/g, "\n"),
          rejectUnauthorized: true,
        }
      : true;

    // Use pg Pool instead of postgres-js to avoid unsupported parameter issues
    const pool = new Pool({
      connectionString: config.database.url,
      ssl: sslConfig,
      max: 1, // Use single connection for migrations
    });

    const db = drizzlePostgres(pool, { schema: prodSchema });

    try {
      await migratePostgres(db, { migrationsFolder: migrationsPath });
      console.log("✅ PostgreSQL migrations completed successfully");
    } catch (error) {
      console.error("❌ PostgreSQL migration failed:", error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  } else {
    // Fallback / local dev: run SQLite migrations against sqlite.db
    console.log("➡ Using SQLite (development) for migrations");
    const sqlitePath = config.databasePath || "sqlite.db";
    const sqlite = new Database(sqlitePath);
    const db = drizzleSqlite({ client: sqlite, schema: devSchema });

    try {
      await migrateSqlite(db, { migrationsFolder: migrationsPath });
      console.log("✅ SQLite migrations completed successfully");
    } catch (error) {
      console.error("❌ SQLite migration failed:", error);
      process.exit(1);
    } finally {
      sqlite.close();
    }
  }

  process.exit(0);
};

runMigrations();