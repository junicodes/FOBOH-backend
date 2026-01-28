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
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.controller.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);