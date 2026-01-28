import { createApp } from "../src/app";
import { initDb } from "../src/config/db";

/**
 * Vercel Serverless Function Entry Point
 * 
 * For Vercel, we need to export the app instead of calling app.listen()
 * The database is initialized on first request (lazy initialization)
 * 
 * IMPORTANT: SQLite with better-sqlite3 has limitations on Vercel:
 * - Vercel's file system is read-only except /tmp
 * - Consider using a different database (PostgreSQL, etc.) for production
 */

let app: any;
let dbInitialized = false;

async function getApp() {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
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
