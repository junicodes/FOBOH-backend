import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    // DEV: local SQLite file
    // PROD: Turso/libsql URL (do NOT hard-code secrets here)
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_PATH || "./sqlite.db",
  },
} satisfies Config;