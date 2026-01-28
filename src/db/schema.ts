import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

/**
 * Brands table
 */
export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

/**
 * Categories table
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

/**
 * SubCategories table
 */
export const subCategories = sqliteTable("sub_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

/**
 * Segments table
 */
export const segments = sqliteTable("segments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

/**
 * SKUs table
 * Standalone table - products reference SKUs
 */
export const skus = sqliteTable("skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuCode: text("sku_code").notNull().unique(),
});

/**
 * Products table
 * References brands, categories, subCategories, segments, and SKUs via foreign keys
 */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  skuId: integer("sku_id")
    .notNull()
    .references(() => skus.id),
  brandId: integer("brand_id")
    .notNull()
    .references(() => brands.id),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  subCategoryId: integer("sub_category_id")
    .notNull()
    .references(() => subCategories.id),
  segmentId: integer("segment_id").references(() => segments.id),
  globalWholesalePrice: real("global_wholesale_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

/**
 * Pricing Profiles table
 * Stores pricing profile configurations
 */
export const pricingProfiles = sqliteTable("pricing_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  adjustmentType: text("adjustment_type").notNull(), // "fixed" | "dynamic"
  adjustmentValue: real("adjustment_value").notNull(),
  incrementType: text("increment_type").notNull(), // "increase" | "decrease"
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

/**
 * Pricing Profile Products table
 * Links products to pricing profiles with their calculated prices
 */
export const pricingProfileProducts = sqliteTable("pricing_profile_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id")
    .notNull()
    .references(() => pricingProfiles.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  basedOnPrice: real("based_on_price").notNull(),
  newPrice: real("new_price").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Type exports
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type SubCategory = typeof subCategories.$inferSelect;
export type NewSubCategory = typeof subCategories.$inferInsert;
export type Segment = typeof segments.$inferSelect;
export type NewSegment = typeof segments.$inferInsert;
export type Sku = typeof skus.$inferSelect;
export type NewSku = typeof skus.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type PricingProfile = typeof pricingProfiles.$inferSelect;
export type NewPricingProfile = typeof pricingProfiles.$inferInsert;
export type PricingProfileProduct = typeof pricingProfileProducts.$inferSelect;
export type NewPricingProfileProduct = typeof pricingProfileProducts.$inferInsert;