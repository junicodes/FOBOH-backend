import swaggerJsdoc from "swagger-jsdoc";
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
      url: "http://localhost:4001/api/v1",
      description: "Development server",
    },
    {
      url: "https://foboh-backend-api.vercel.app/api/v1",
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

const options = {
  definition: swaggerDefinition,
  // NOTE: We no longer use `src/modules/*`. Route JSDoc lives in `src/routes/*`.
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts", "./src/schemas/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);