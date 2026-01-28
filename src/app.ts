import express, { Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { swaggerSpec } from "./docs/swagger";
import productRoutes from "./routes/products/product.routes";
import pricingProfileRoutes from "./routes/pricing-profile/pricing-profile.routes";

/**
 * Express app setup
 */
export function createApp(): Express {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger documentation
  app.use("/api-docs", ...(swaggerUi.serve as any), swaggerUi.setup(swaggerSpec) as any);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API routes with versioning
  app.use("/api/v1/products", productRoutes);
  app.use("/api/v1/pricing-profiles", pricingProfileRoutes);

  // Centralized error handling (must be last)
  app.use(errorMiddleware);

  return app;
}