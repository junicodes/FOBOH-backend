/**
 * Schema index — exports the correct schema (dev or prod) based on NODE_ENV.
 * Use this in services that need to work with both SQLite (dev) and PostgreSQL (prod).
 */
import { config } from "../../config/env";
import type * as DevSchema from "./dev.schema";
import type * as ProdSchema from "./prod.schema";

const schema =
  config.nodeEnv === "production"
    ? (require("./prod.schema") as typeof ProdSchema)
    : (require("./dev.schema") as typeof DevSchema);

export const brands = schema.brands;
export const categories = schema.categories;
export const subCategories = schema.subCategories;
export const segments = schema.segments;
export const skus = schema.skus;
export const products = schema.products;
export const pricingProfiles = schema.pricingProfiles;
export const pricingProfileProducts = schema.pricingProfileProducts;

// Re-export types from dev schema for use in services (structure is compatible)
export type {
  NewPricingProfile,
  NewPricingProfileProduct,
  PricingProfile,
} from "./dev.schema";
