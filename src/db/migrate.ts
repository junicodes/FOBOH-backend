import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

const runMigrations = async () => {
  console.log("⏳ Running migrations...");

  const sqlite = new Database("sqlite.db");
  const db = drizzle({ client: sqlite, schema });

  try {
    const migrationsPath = path.join(__dirname, "migrations");
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  sqlite.close();
  process.exit(0);
};

runMigrations();