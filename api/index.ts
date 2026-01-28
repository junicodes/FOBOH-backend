import { createApp } from "../src/app";
import { initDb, getDb } from "../src/config/db";
import { seedDatabase } from "../src/db/seed";
import { brands } from "../src/db/schema";

/**
 * Vercel Serverless Function Entry Point
 * 
 * For Vercel, we need to export the app instead of calling app.listen()
 * The database is initialized on first request (lazy initialization)
 * 
 * IMPORTANT: SQLite with better-sqlite3 has limitations on Vercel:
 * - Vercel's file system is read-only except /tmp
 * - Each cold start needs to run migrations and seed data
 * - Consider using a different database (PostgreSQL, etc.) for production
 */

let app: any;
let dbInitialized = false;
let dbSeeded = false;

async function getApp() {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
      
      // Seed database if not already seeded (check if brands table has data)
      if (!dbSeeded) {
        try {
          const db = getDb();
          const existingBrands = await db.select().from(brands).limit(1);
          
          // Only seed if database is empty
          if (existingBrands.length === 0) {
            console.log("🌱 Seeding database...");
            await seedDatabase();
            console.log("✅ Database seeded successfully");
          }
          dbSeeded = true;
        } catch (seedError) {
          console.error("⚠️ Seed failed (might already be seeded):", seedError);
          // Continue - database might already have data
        }
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
      // Continue anyway - database might already be initialized
    }
  }

  if (!app) {
    app = createApp();
  }

  return app;
}

// Export the handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
