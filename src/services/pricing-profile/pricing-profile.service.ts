import { getDb } from "../../config/db";
import { config } from "../../config/env";
// Import from the correct schema based on environment
import type {
  pricingProfiles as PricingProfilesType,
  pricingProfileProducts as PricingProfileProductsType,
  products as ProductsType,
  skus as SkusType,
  categories as CategoriesType,
  NewPricingProfile,
  NewPricingProfileProduct,
  PricingProfile,
} from "../../db/schemas/dev.schema";
import type {
  pricingProfiles as PricingProfilesProdType,
  pricingProfileProducts as PricingProfileProductsProdType,
  products as ProductsProdType,
  skus as SkusProdType,
  categories as CategoriesProdType,
} from "../../db/schemas/prod.schema";

// Use the correct schema types based on environment
const isProd = config.nodeEnv === "production";
const pricingProfiles = isProd ? (require("../../db/schemas/prod.schema").pricingProfiles as typeof PricingProfilesProdType) : (require("../../db/schemas/dev.schema").pricingProfiles as typeof PricingProfilesType);
const pricingProfileProducts = isProd ? (require("../../db/schemas/prod.schema").pricingProfileProducts as typeof PricingProfileProductsProdType) : (require("../../db/schemas/dev.schema").pricingProfileProducts as typeof PricingProfileProductsType);
const products = isProd ? (require("../../db/schemas/prod.schema").products as typeof ProductsProdType) : (require("../../db/schemas/dev.schema").products as typeof ProductsType);
const skus = isProd ? (require("../../db/schemas/prod.schema").skus as typeof SkusProdType) : (require("../../db/schemas/dev.schema").skus as typeof SkusType);
const categories = isProd ? (require("../../db/schemas/prod.schema").categories as typeof CategoriesProdType) : (require("../../db/schemas/dev.schema").categories as typeof CategoriesType);
import { eq, desc, inArray } from "drizzle-orm";
import { calculateAdjustment } from "./calculateAdjustment";

/**
 * Pricing Profile service
 * Business logic for pricing profile operations
 * Uses calculateAdjustment service for price calculations
 */
export class PricingProfileService {
  /**
   * Create a new pricing profile
   * Calculates prices on the backend using calculateAdjustment service
   * Returns the pricing table data for frontend display
   */
  async createProfile(data: {
    name: string;
    adjustmentType: "fixed" | "dynamic";
    adjustmentValue: number;
    incrementType: "increase" | "decrease";
    productIds: number[];
  }) {
    const db = getDb();

    // Get products with their details
    const selectedProducts = await db
      .select({
        id: products.id,
        title: products.title,
        globalWholesalePrice: products.globalWholesalePrice,
        categoryName: categories.name,
        skuCode: skus.skuCode,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(skus, eq(products.skuId, skus.id))
      .where(inArray(products.id, data.productIds));

    if (selectedProducts.length === 0) {
      throw new Error("No products found for the provided product IDs");
    }

    // Calculate prices for each product using the calculateAdjustment service
    const calculatedPrices: Array<{
      productId: number;
      basedOnPrice: number;
      newPrice: number;
    }> = [];

    for (const product of selectedProducts) {
      // Use global wholesale price as base price
      const basePrice = product.globalWholesalePrice;

      // Validate base price
      if (!basePrice || basePrice <= 0) {
        throw new Error(`Product "${product.title}" has invalid base price: ${basePrice}`);
      }

      // Calculate new price using the calculateAdjustment service
      // This will throw an error if validation fails (edge cases like negative values)
      try {
        const newPrice = calculateAdjustment({
          basePrice,
          adjustmentType: data.adjustmentType,
          adjustmentValue: data.adjustmentValue,
          incrementType: data.incrementType,
        });

        calculatedPrices.push({
          productId: product.id,
          basedOnPrice: basePrice,
          newPrice,
        });
      } catch (error) {
        throw new Error(
          `Failed to calculate price for product "${product.title}": ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Create pricing profile
    // IMPORTANT: Don't include createdAt/updatedAt - PostgreSQL will use DEFAULT now()
    // Drizzle's .defaultNow() might convert to Unix timestamp, so we exclude them entirely
    const insertedProfiles = await db
      .insert(pricingProfiles)
      .values({
        name: data.name,
        adjustmentType: data.adjustmentType,
        adjustmentValue: data.adjustmentValue,
        incrementType: data.incrementType,
      })
      .returning();

    const insertedProfile = insertedProfiles[0];

    // Create pricing profile products with calculated prices
    const profileProducts: NewPricingProfileProduct[] = calculatedPrices.map(
      (price) => ({
        profileId: insertedProfile.id,
        productId: price.productId,
        basedOnPrice: price.basedOnPrice,
        newPrice: price.newPrice,
      })
    );

    await db.insert(pricingProfileProducts).values(profileProducts);

    // Return profile with calculated pricing table data
    const profileProductsData = await db
      .select({
        id: pricingProfileProducts.id,
        productId: pricingProfileProducts.productId,
        basedOnPrice: pricingProfileProducts.basedOnPrice,
        newPrice: pricingProfileProducts.newPrice,
        productTitle: products.title,
        productSku: skus.skuCode,
        categoryName: categories.name,
      })
      .from(pricingProfileProducts)
      .leftJoin(products, eq(pricingProfileProducts.productId, products.id))
      .leftJoin(skus, eq(products.skuId, skus.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(pricingProfileProducts.profileId, insertedProfile.id));

    // Format response for pricing table
    const pricingTable = profileProductsData.map((item: { productId: any; productTitle: any; productSku: any; categoryName: any; basedOnPrice: number; newPrice: number; }) => ({
      id: item.productId,
      title: item.productTitle || "",
      sku: item.productSku || "",
      category: item.categoryName || "",
      wholesalePrice: item.basedOnPrice,
      adjustment: Math.abs(item.basedOnPrice - item.newPrice),
      newPrice: item.newPrice,
      adjustmentType: data.adjustmentType,
      originalAdjustmentValue: data.adjustmentValue,
      incrementType: data.incrementType,
    }));

      return {
      ...insertedProfile,
      products: profileProductsData,
      pricingTable, // Return pricing table data for frontend display
    };
  }

  /**
   * Get all pricing profiles with pricing table data
   */
  async getAllProfiles() {
    const db = getDb();
    const profiles = await db
      .select()
      .from(pricingProfiles)
      .orderBy(desc(pricingProfiles.createdAt));

    // For each profile, get its pricing table with adjustment info
    const profilesWithTables = await Promise.all(
      profiles.map(async (profile: typeof profiles[0]) => {
        const profileProducts = await db
          .select({
            id: pricingProfileProducts.id,
            productId: pricingProfileProducts.productId,
            basedOnPrice: pricingProfileProducts.basedOnPrice,
            newPrice: pricingProfileProducts.newPrice,
            productTitle: products.title,
            productSku: skus.skuCode,
            categoryName: categories.name,
          })
          .from(pricingProfileProducts)
          .leftJoin(products, eq(pricingProfileProducts.productId, products.id))
          .leftJoin(skus, eq(products.skuId, skus.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(eq(pricingProfileProducts.profileId, profile.id));

        const pricingTable = profileProducts.map((item: { productId: any; productTitle: any; productSku: any; categoryName: any; basedOnPrice: number; newPrice: number; }) => ({
          id: item.productId,
          title: item.productTitle || "",
          sku: item.productSku || "",
          category: item.categoryName || "",
          wholesalePrice: item.basedOnPrice,
          adjustment: Math.abs(item.basedOnPrice - item.newPrice),
          newPrice: item.newPrice,
          adjustmentType: profile.adjustmentType,
          originalAdjustmentValue: profile.adjustmentValue,
          incrementType: profile.incrementType,
        }));

        return {
          ...profile,
          pricingTable,
        };
      })
    );

    return profilesWithTables;
  }

  /**
   * Get pricing profile by ID with pricing table data
   */
  async getProfileById(id: number) {
    const db = getDb();
    const profile = await db
      .select()
      .from(pricingProfiles)
      .where(eq(pricingProfiles.id, id))
      .limit(1);

    if (profile.length === 0) {
      throw new Error(`Pricing profile with id ${id} not found`);
    }

    const profileProducts = await db
      .select({
        id: pricingProfileProducts.id,
        productId: pricingProfileProducts.productId,
        basedOnPrice: pricingProfileProducts.basedOnPrice,
        newPrice: pricingProfileProducts.newPrice,
        productTitle: products.title,
        productSku: skus.skuCode,
        categoryName: categories.name,
      })
      .from(pricingProfileProducts)
      .leftJoin(products, eq(pricingProfileProducts.productId, products.id))
      .leftJoin(skus, eq(products.skuId, skus.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(pricingProfileProducts.profileId, id));

    // Format response for pricing table
    const pricingTable = profileProducts.map((item: { productId: any; productTitle: any; productSku: any; categoryName: any; basedOnPrice: number; newPrice: number; }) => ({
      id: item.productId,
      title: item.productTitle || "",
      sku: item.productSku || "",
      category: item.categoryName || "",
      wholesalePrice: item.basedOnPrice,
      adjustment: Math.abs(item.basedOnPrice - item.newPrice),
      newPrice: item.newPrice,
      adjustmentType: profile[0].adjustmentType,
      originalAdjustmentValue: profile[0].adjustmentValue,
      incrementType: profile[0].incrementType,
    }));

    return {
      ...profile[0],
      products: profileProducts,
      pricingTable, // Return pricing table data for frontend display
    };
  }

  /**
   * Update pricing profile
   * Recalculates prices if adjustment parameters or products change
   */
  async updateProfile(
    id: number,
    data: {
      name?: string;
      adjustmentType?: "fixed" | "dynamic";
      adjustmentValue?: number;
      incrementType?: "increase" | "decrease";
      productIds?: number[];
    }
  ): Promise<PricingProfile> {
    const db = getDb();

    // Get existing profile to use current values if not provided
    const existingProfile = await db
      .select()
      .from(pricingProfiles)
      .where(eq(pricingProfiles.id, id))
      .limit(1);

    if (existingProfile.length === 0) {
      throw new Error(`Pricing profile with id ${id} not found`);
    }

    const currentProfile = existingProfile[0];

    // Determine if we need to recalculate prices
    const needsRecalculation =
      data.productIds !== undefined ||
      data.adjustmentType !== undefined ||
      data.adjustmentValue !== undefined ||
      data.incrementType !== undefined;

    // Update profile metadata
    const updateData: Partial<NewPricingProfile> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.adjustmentType !== undefined)
      updateData.adjustmentType = data.adjustmentType;
    if (data.adjustmentValue !== undefined)
      updateData.adjustmentValue = data.adjustmentValue;
    if (data.incrementType !== undefined)
      updateData.incrementType = data.incrementType;
    updateData.updatedAt = new Date();

    await db.update(pricingProfiles).set(updateData).where(eq(pricingProfiles.id, id));

    // Recalculate prices if needed
    if (needsRecalculation) {
      const productIds = data.productIds || [];
      const adjustmentType: "fixed" | "dynamic" = (data.adjustmentType || currentProfile.adjustmentType) as "fixed" | "dynamic";
      const adjustmentValue =
        data.adjustmentValue !== undefined
          ? data.adjustmentValue
          : currentProfile.adjustmentValue;
      const incrementType: "increase" | "decrease" = (data.incrementType || currentProfile.incrementType) as "increase" | "decrease";

      // Get products
      const selectedProducts = await db
        .select({
          id: products.id,
          title: products.title,
          globalWholesalePrice: products.globalWholesalePrice,
          categoryName: categories.name,
          skuCode: skus.skuCode,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(skus, eq(products.skuId, skus.id))
        .where(inArray(products.id, productIds));

      // Calculate prices using calculateAdjustment service
      const calculatedPrices: NewPricingProfileProduct[] = [];
      for (const product of selectedProducts) {
        const basePrice = product.globalWholesalePrice;

        // Validate base price
        if (!basePrice || basePrice <= 0) {
          throw new Error(`Product "${product.title}" has invalid base price: ${basePrice}`);
        }

        // Calculate new price - will throw error if validation fails
        try {
          const newPrice = calculateAdjustment({
            basePrice,
            adjustmentType,
            adjustmentValue,
            incrementType,
          });

          calculatedPrices.push({
            profileId: id,
            productId: product.id,
            basedOnPrice: basePrice,
            newPrice,
          });
        } catch (error) {
          throw new Error(
            `Failed to calculate price for product "${product.title}": ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Delete existing products and insert new ones
      await db
        .delete(pricingProfileProducts)
        .where(eq(pricingProfileProducts.profileId, id));

      if (calculatedPrices.length > 0) {
        await db.insert(pricingProfileProducts).values(calculatedPrices);
      }
    }

    return await this.getProfileById(id);
  }

  /**
   * Delete pricing profile
   */
  async deleteProfile(id: number) {
    const db = getDb();

    const existing = await db
      .select()
      .from(pricingProfiles)
      .where(eq(pricingProfiles.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new Error(`Pricing profile with id ${id} not found`);
    }

    // Delete profile products first
    await db
      .delete(pricingProfileProducts)
      .where(eq(pricingProfileProducts.profileId, id));

    // Delete profile
    await db.delete(pricingProfiles).where(eq(pricingProfiles.id, id));

    return { success: true };
  }
}

// Export singleton instance
export const pricingProfileService = new PricingProfileService();