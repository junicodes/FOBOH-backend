import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { config } from "./src/config/env";

const isProd = config.nodeEnv === "production";

/**
 * Drizzle Kit Configuration
 * 
 * - Development (NODE_ENV !== "production"):
 *   - Generates SQLite migrations to ./src/db/migrations
 *   - Uses local sqlite.db file
 * 
 * - Production (NODE_ENV === "production"):
 *   - Generates PostgreSQL migrations to ./drizzle
 *   - Uses DATABASE_URL from environment
 */
export default defineConfig({
  schema: isProd ? "./src/db/schemas/prod.schema.ts" : "./src/db/schemas/dev.schema.ts",
  out: isProd ? "./src/db/migrations/prod" : "./src/db/migrations/dev",
  dialect: isProd ? "postgresql" : "sqlite",
  dbCredentials: isProd
    ? {
        // Production PostgreSQL
        url: config.database.url,
      }
    : {
        // Local SQLite for development
        url: process.env.DATABASE_PATH || "./sqlite.db",
      },
});
