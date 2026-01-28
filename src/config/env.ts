import dotenv from "dotenv";

dotenv.config();

/**
 * Environment configuration
 * Centralized env variable access with defaults
 */
export const config = {
  port: parseInt(process.env.PORT || "4001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Local SQLite (development)
  databasePath: process.env.DATABASE_PATH || "./sqlite.db",

  // Production PostgreSQL (connection URL + optional CA cert)
  database: {
    url: process.env.DATABASE_URL || "",
    ca: process.env.DATABASE_CA || ``,
  },

  // CORS origins
  corsOriginDev: process.env.CORS_ORIGIN_DEV || "http://localhost:4000",
  corsOriginProd: process.env.CORS_ORIGIN_PROD || "https://foboh-frontend.vercel.app",

  // Rate limiting
  rateLimitWindowMs: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ), // 15 minutes
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10
  ),
};

