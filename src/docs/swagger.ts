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
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "High Garden Pinot Noir 2021" },
          skuCode: { type: "string", example: "HGVPIN216" },
          brandId: { type: "integer", example: 1 },
          brandName: { type: "string", example: "High Garden" },
          categoryId: { type: "integer", example: 1 },
          categoryName: { type: "string", example: "Alcoholic Beverage" },
          subCategoryId: { type: "integer", example: 1 },
          subCategoryName: { type: "string", example: "Wine" },
          segmentId: { type: "integer", example: 1 },
          segmentName: { type: "string", example: "Red" },
          globalWholesalePrice: { type: "number", example: 279.06 },
          quantity: { type: "integer", example: 45 },
        },
      },
      PricingProfile: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Sure Work" },
          adjustmentType: {
            type: "string",
            enum: ["fixed", "dynamic"],
            example: "dynamic",
          },
          adjustmentValue: { type: "number", example: 10 },
          incrementType: {
            type: "string",
            enum: ["increase", "decrease"],
            example: "increase",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-02-28T10:30:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-02-28T10:30:00.000Z",
          },
          pricingTable: {
            type: "array",
            description:
              "Calculated prices for each product in the profile (returned from create/update APIs)",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                title: { type: "string", example: "High Garden Pinot Noir 2021" },
                skuCode: { type: "string", example: "HGVPIN216" },
                basedOnPrice: { type: "number", example: 279.06 },
                newPrice: { type: "number", example: 306.97 },
              },
            },
          },
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
        description:
          "Returns a list of products with joined reference data (brand, category, sub-category, segment, SKU). Supports optional filters and search. This is the main endpoint the frontend uses to populate the product list and dropdown filters on the pricing setup and edit screens.",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "subCategory", in: "query", schema: { type: "string" } },
          { name: "segment", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "sku", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "List of products",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
                example: [
                  {
                    id: 1,
                    title: "High Garden Pinot Noir 2021",
                    skuCode: "HGVPIN216",
                    brandId: 1,
                    brandName: "High Garden",
                    categoryId: 1,
                    categoryName: "Alcoholic Beverage",
                    subCategoryId: 1,
                    subCategoryName: "Wine",
                    segmentId: 1,
                    segmentName: "Red",
                    globalWholesalePrice: 279.06,
                    quantity: 45,
                  },
                  {
                    id: 2,
                    title: "Koyama Methode Brut Nature NV",
                    skuCode: "KOYBRUNV6",
                    brandId: 2,
                    brandName: "Koyama Wines",
                    categoryId: 1,
                    categoryName: "Alcoholic Beverage",
                    subCategoryId: 1,
                    subCategoryName: "Wine",
                    segmentId: 2,
                    segmentName: "Sparkling",
                    globalWholesalePrice: 120.0,
                    quantity: 32,
                  },
                ],
              },
            },
          },
        },
      },
    },
    "/api/v1/products/search": {
      get: {
        tags: ["Products"],
        summary: "Search products",
        description:
          "Searches products by title and SKU with optional filters (brand, category, sub-category, segment, SKU). This is used by the frontend when the user types in the 'Search for Products' box.",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "subCategory", in: "query", schema: { type: "string" } },
          { name: "segment", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "sku", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/products/brands": {
      get: {
        tags: ["Products"],
        summary: "Get all brands",
        description:
          "Returns the list of all brands. Used by the frontend to populate the Brand dropdown filter.",
        responses: {
          200: {
            description: "List of brands",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      name: { type: "string", example: "High Garden" },
                    },
                  },
                },
                example: [
                  { id: 1, name: "High Garden" },
                  { id: 2, name: "Koyama Wines" },
                  { id: 3, name: "Lacourte-Godbillon" },
                ],
              },
            },
          },
        },
      },
    },
    "/api/v1/products/categories": {
      get: {
        tags: ["Products"],
        summary: "Get all categories",
        description:
          "Returns the list of all product categories. Used by the frontend to populate the Category dropdown filter.",
        responses: {
          200: {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      name: { type: "string", example: "Alcoholic Beverage" },
                    },
                  },
                },
                example: [{ id: 1, name: "Alcoholic Beverage" }],
              },
            },
          },
        },
      },
    },
    "/api/v1/products/sub-categories": {
      get: {
        tags: ["Products"],
        summary: "Get all sub-categories",
        description:
          "Returns the list of all product sub-categories. Used by the frontend to populate the Sub Category dropdown filter.",
        responses: {
          200: {
            description: "List of sub-categories",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      name: { type: "string", example: "Wine" },
                    },
                  },
                },
                example: [{ id: 1, name: "Wine" }],
              },
            },
          },
        },
      },
    },
    "/api/v1/products/segments": {
      get: {
        tags: ["Products"],
        summary: "Get all segments",
        description:
          "Returns the list of all product segments (e.g. Red, Sparkling). Used by the frontend to populate the Segment dropdown filter.",
        responses: {
          200: {
            description: "List of segments",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      name: { type: "string", example: "Red" },
                    },
                  },
                },
                example: [
                  { id: 1, name: "Red" },
                  { id: 2, name: "Sparkling" },
                  { id: 3, name: "Port/Dessert" },
                  { id: 4, name: "White" },
                ],
              },
            },
          },
        },
      },
    },
    "/api/v1/products/skus": {
      get: {
        tags: ["Products"],
        summary: "Get all SKUs",
        description:
          "Returns the list of all SKUs. Used by the frontend to populate the SKU dropdown filter.",
        responses: {
          200: {
            description: "List of SKUs",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      skuCode: { type: "string", example: "HGVPIN216" },
                    },
                  },
                },
                example: [
                  { id: 1, skuCode: "HGVPIN216" },
                  { id: 2, skuCode: "KOYBRUNV6" },
                  { id: 3, skuCode: "KOYNR1837" },
                  { id: 4, skuCode: "KOYRIE19" },
                  { id: 5, skuCode: "LACBNATNV6" },
                ],
              },
            },
          },
        },
      },
    },
    "/api/v1/pricing-profiles": {
      get: {
        tags: ["Pricing Profiles"],
        summary: "Get all pricing profiles",
        description:
          "Returns all pricing profiles, including basic configuration and pricing table preview data. Used to populate the main Pricing Profiles list screen on the frontend.",
        responses: {
          200: {
            description: "List of pricing profiles",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PricingProfile" },
                },
                example: [
                  {
                    id: 1,
                    name: "Sure Work",
                    adjustmentType: "dynamic",
                    adjustmentValue: 10,
                    incrementType: "increase",
                    createdAt: "2025-02-28T10:30:00.000Z",
                    updatedAt: "2025-02-28T10:30:00.000Z",
                    pricingTable: [
                      {
                        id: 1,
                        title: "High Garden Pinot Noir 2021",
                        skuCode: "HGVPIN216",
                        basedOnPrice: 279.06,
                        newPrice: 306.97,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      post: {
        tags: ["Pricing Profiles"],
        summary: "Create a new pricing profile",
        description:
          "Creates a new pricing profile and calculates new prices for all selected products. The response includes both the profile configuration and a pricing table that the frontend uses to render the preview table.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PricingProfile" },
            },
          },
        },
        responses: {
          201: {
            description: "Created pricing profile with pricing table",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PricingProfile" },
                example: {
                  id: 1,
                  name: "Sure Work",
                  adjustmentType: "dynamic",
                  adjustmentValue: 10,
                  incrementType: "increase",
                  createdAt: "2025-02-28T10:30:00.000Z",
                  updatedAt: "2025-02-28T10:30:00.000Z",
                  pricingTable: [
                    {
                      id: 1,
                      title: "High Garden Pinot Noir 2021",
                      skuCode: "HGVPIN216",
                      basedOnPrice: 279.06,
                      newPrice: 306.97,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/pricing-profiles/{id}": {
      get: {
        tags: ["Pricing Profiles"],
        summary: "Get pricing profile by ID",
        description:
          "Returns a single pricing profile by ID, including its configuration and pricing table. Used by the frontend on the View/Edit profile page.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Pricing profile ID",
          },
        ],
        responses: {
          200: {
            description: "Pricing profile details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PricingProfile" },
              },
            },
          },
          404: { description: "Not found" },
        },
      },
      put: {
        tags: ["Pricing Profiles"],
        summary: "Update pricing profile",
        description:
          "Updates an existing pricing profile and recalculates prices for the selected products. The response includes the updated profile and pricing table.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Pricing profile ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PricingProfile" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated pricing profile with recalculated pricing table",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PricingProfile" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Pricing Profiles"],
        summary: "Delete pricing profile",
        description:
          "Deletes a pricing profile by ID. Used by the frontend when a user clicks the Delete button on the Pricing Profiles list page.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Pricing profile ID",
          },
        ],
        responses: {
          200: { description: "Pricing profile deleted successfully" },
          404: { description: "Not found" },
        },
      },
    },
  },
} as const;