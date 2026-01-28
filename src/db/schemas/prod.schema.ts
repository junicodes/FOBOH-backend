import { pgTable, text, real, integer, serial, timestamp } from "drizzle-orm/pg-core";

/**
 * Brands table
 */
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Categories table
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * SubCategories table
 */
export const subCategories = pgTable("sub_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Segments table
 */
export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * SKUs table
 * Standalone table - products reference SKUs
 */
export const skus = pgTable("skus", {
  id: serial("id").primaryKey(),
  skuCode: text("sku_code").notNull().unique(),
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Products table
 * References brands, categories, subCategories, segments, and SKUs via foreign keys
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
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
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Pricing Profiles table
 * Stores pricing profile configurations
 */
export const pricingProfiles = pgTable("pricing_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  adjustmentType: text("adjustment_type").notNull(), // "fixed" | "dynamic"
  adjustmentValue: real("adjustment_value").notNull(),
  incrementType: text("increment_type").notNull(), // "increase" | "decrease"
  // Timestamps - use defaultNow() which makes them optional in inserts
  // PostgreSQL will use DEFAULT now() from the migration
  createdAt: timestamp("created_at", { mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull(),
});

/**
 * Pricing Profile Products table
 * Links products to pricing profiles with their calculated prices
 */
export const pricingProfileProducts = pgTable("pricing_profile_products", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => pricingProfiles.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  basedOnPrice: real("based_on_price").notNull(),
  newPrice: real("new_price").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
  .defaultNow()
  .notNull(),
   updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull(),
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
