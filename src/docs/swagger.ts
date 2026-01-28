import { SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "FOBOH Pricing API",
    version: "1.0.0",
    description: "API for managing products and pricing profiles",
  },
  servers: [
    {
      url: "http://localhost:4001",
      description: "Development server",
    },
    {
      url: "https://foboh-backend-api.vercel.app",
      description: "Production (Vercel)",
    },
  ],
  components: {
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          skuCode: { type: "string" },
          brand: { type: "string" },
          categoryId: { type: "string" },
          subCategoryId: { type: "string" },
          segmentId: { type: "string" },
          globalWholesalePrice: { type: "number" },
        },
      },
      PricingProfile: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          basedOnProfileId: { type: "integer", nullable: true },
          adjustmentType: { type: "string", enum: ["fixed", "dynamic"] },
          adjustmentValue: { type: "number" },
          incrementType: { type: "string", enum: ["increase", "decrease"] },
        },
      },
      CalculatePricesRequest: {
        type: "object",
        required: [
          "productIds",
          "adjustmentType",
          "adjustmentValue",
          "incrementType",
        ],
        properties: {
          productIds: {
            type: "array",
            items: { type: "integer" },
          },
          basedOnProfileId: { type: "integer", nullable: true },
          adjustmentType: { type: "string", enum: ["fixed", "dynamic"] },
          adjustmentValue: { type: "number" },
          incrementType: { type: "string", enum: ["increase", "decrease"] },
        },
      },
      ApplyPricingRequest: {
        type: "object",
        required: ["pricingProfileId", "productIds", "calculatedPrices"],
        properties: {
          pricingProfileId: { type: "integer" },
          productIds: {
            type: "array",
            items: { type: "integer" },
          },
          calculatedPrices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "integer" },
                newPrice: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * NOTE on Vercel:
 * Vercel Serverless often bundles TS into a single function and does not keep the original
 * source files on disk. `swagger-jsdoc` relies on reading files via globs, so it can return
 * an empty spec in production even when it works locally.
 *
 * To keep Swagger reliable in serverless, we define the `paths` explicitly here.
 */
export const swaggerSpec = {
  ...swaggerDefinition,
  paths: {
    "/api/v1/products": {
      get: {
        tags: ["Products"],
        summary: "Get all products",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "subCategory", in: "query", schema: { type: "string" } },
          { name: "segment", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "sku", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of products" },
        },
      },
    },
    "/api/v1/products/search": {
      get: {
        tags: ["Products"],
        summary: "Search products",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "subCategory", in: "query", schema: { type: "string" } },
          { name: "segment", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "sku", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Search results" },
        },
      },
    },
    "/api/v1/products/brands": {
      get: {
        tags: ["Products"],
        summary: "Get all brands",
        responses: { 200: { description: "List of brands" } },
      },
    },
    "/api/v1/products/categories": {
      get: {
        tags: ["Products"],
        summary: "Get all categories",
        responses: { 200: { description: "List of categories" } },
      },
    },
    "/api/v1/products/sub-categories": {
      get: {
        tags: ["Products"],
        summary: "Get all sub-categories",
        responses: { 200: { description: "List of sub-categories" } },
      },
    },
    "/api/v1/products/segments": {
      get: {
        tags: ["Products"],
        summary: "Get all segments",
        responses: { 200: { description: "List of segments" } },
      },
    },
    "/api/v1/products/skus": {
      get: {
        tags: ["Products"],
        summary: "Get all SKUs",
        responses: { 200: { description: "List of SKUs" } },
      },
    },
    "/api/v1/pricing-profiles": {
      get: {
        tags: ["Pricing Profiles"],
        summary: "Get all pricing profiles",
        responses: { 200: { description: "List of pricing profiles" } },
      },
      post: {
        tags: ["Pricing Profiles"],
        summary: "Create a new pricing profile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PricingProfile" },
            },
          },
        },
        responses: { 201: { description: "Created pricing profile" } },
      },
    },
    "/api/v1/pricing-profiles/{id}": {
      get: {
        tags: ["Pricing Profiles"],
        summary: "Get pricing profile by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Pricing profile" }, 404: { description: "Not found" } },
      },
      put: {
        tags: ["Pricing Profiles"],
        summary: "Update pricing profile",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PricingProfile" },
            },
          },
        },
        responses: { 200: { description: "Updated pricing profile" } },
      },
      delete: {
        tags: ["Pricing Profiles"],
        summary: "Delete pricing profile",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Deleted pricing profile" } },
      },
    },
  },
} as const;