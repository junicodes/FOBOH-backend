import { initDb } from "../config/db";
import { seedDatabase } from "./seed/index";

/**
 * Main seed entry point
 * Automatically selects SQLite or PostgreSQL seed based on NODE_ENV
 * Run with: npm run seed
 */
if (require.main === module) {
  (async () => {
    try {
      await initDb();
      await seedDatabase();
      console.log("✅ Seed completed successfully");
      process.exit(0);
    } catch (error) {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    }
  })();
}

export { seedDatabase } from "./seed/index";
