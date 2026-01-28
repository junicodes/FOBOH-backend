import { config } from "../../config/env";
import { seedDatabase as seedDev } from "./dev.seed";
import { seedDatabase as seedProd } from "./prod.seed";

/**
 * Seed entry point
 * Automatically selects the correct seed function based on NODE_ENV
 */
export async function seedDatabase() {
  if (config.nodeEnv === "production") {
    console.log("🌱 Running PostgreSQL seed...");
    return await seedProd();
  } else {
    console.log("🌱 Running SQLite seed...");
    return await seedDev();
  }
}

// Export individual seed functions for direct use if needed
export { seedDatabase as seedDev } from "./dev.seed";
export { seedDatabase as seedProd } from "./prod.seed";
