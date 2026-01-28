import express, { Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
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
  // Vercel can return HTML for swagger-ui asset requests (causing "Unexpected token '<'").
  // To avoid serving swagger-ui assets from the serverless bundle, we render Swagger UI
  // from a CDN and point it at our own JSON spec endpoint.
  app.get("/api-docs/swagger.json", (_req, res) => {
    return res.json(swaggerSpec);
  });

  app.get("/api-docs", (_req, res) => {
    // Use CDN-hosted Swagger UI so assets always load in Vercel.
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FOBOH API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body { margin: 0; padding: 0; }
      #swagger-ui { padding: 16px; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '/api-docs/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: 'StandaloneLayout'
        });
      };
    </script>
  </body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API routes with versioning
  app.use("/api/v1/products", productRoutes);
  app.use("/api/v1/pricing-profiles", pricingProfileRoutes);

  // Centralized error handling (must be last)
  app.use(errorHandler);

  return app;
}