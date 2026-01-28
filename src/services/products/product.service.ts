import { getDb } from "../../config/db";
import {
  products,
  skus,
  brands,
  categories,
  subCategories,
  segments,
} from "../../db/schema";
import { eq, like, or, and } from "drizzle-orm";

/**
 * Product service
 * Business logic for products
 */
export const productService = {
  /**
   * Get all products with optional filtering and search
   * Joins with related tables to filter by name
   * Search considers all dropdown filters
   */
  getAll: async (filters?: {
    category?: string;
    subCategory?: string;
    segment?: string;
    brand?: string;
    search?: string;
    sku?: string;
  }) => {
    const db = getDb();

    // Build base query with joins
    let baseQuery = db
      .select({
        id: products.id,
        title: products.title,
        skuCode: skus.skuCode,
        brandId: products.brandId,
        brandName: brands.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        subCategoryId: products.subCategoryId,
        subCategoryName: subCategories.name,
        segmentId: products.segmentId,
        segmentName: segments.name,
        globalWholesalePrice: products.globalWholesalePrice,
        quantity: products.quantity,
      })
      .from(products)
      .leftJoin(skus, eq(products.skuId, skus.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subCategories, eq(products.subCategoryId, subCategories.id))
      .leftJoin(segments, eq(products.segmentId, segments.id));

    // Build conditions array
    const conditions = [];

    // Apply filters if provided (search considers dropdowns)
    if (filters) {
      if (filters.category) {
        conditions.push(eq(categories.name, filters.category));
      }
      if (filters.subCategory) {
        conditions.push(eq(subCategories.name, filters.subCategory));
      }
      if (filters.segment) {
        conditions.push(eq(segments.name, filters.segment));
      }
      if (filters.brand) {
        conditions.push(eq(brands.name, filters.brand));
      }
      if (filters.sku) {
        conditions.push(like(skus.skuCode, `%${filters.sku}%`));
      }
      // Search considers all filters - searches in title and SKU
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        conditions.push(
          or(
            like(products.title, searchTerm),
            like(skus.skuCode, searchTerm)
          )
        );
      }
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      return await baseQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      );
    }

    return await baseQuery;
  },

  /**
   * Search products by title, SKU (with fuzzy matching) and optional filters
   * Search considers dropdown filters
   */
  search: async (query: string, filters?: {
    category?: string;
    subCategory?: string;
    segment?: string;
    brand?: string;
    sku?: string;
  }) => {
    const db = getDb();
    
    const baseQuery = db
      .select({
        id: products.id,
        title: products.title,
        skuCode: skus.skuCode,
        brandId: products.brandId,
        brandName: brands.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        subCategoryId: products.subCategoryId,
        subCategoryName: subCategories.name,
        segmentId: products.segmentId,
        segmentName: segments.name,
        globalWholesalePrice: products.globalWholesalePrice,
        quantity: products.quantity,
      })
      .from(products)
      .leftJoin(skus, eq(products.skuId, skus.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subCategories, eq(products.subCategoryId, subCategories.id))
      .leftJoin(segments, eq(products.segmentId, segments.id));

    const conditions = [];

    // Add search condition if query provided
    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      conditions.push(
        or(
          like(products.title, searchTerm),
          like(skus.skuCode, searchTerm)
        )
      );
    }

    // Apply filters if provided (search considers dropdowns)
    if (filters) {
      if (filters.category) {
        conditions.push(eq(categories.name, filters.category));
      }
      if (filters.subCategory) {
        conditions.push(eq(subCategories.name, filters.subCategory));
      }
      if (filters.segment) {
        conditions.push(eq(segments.name, filters.segment));
      }
      if (filters.brand) {
        conditions.push(eq(brands.name, filters.brand));
      }
      if (filters.sku) {
        conditions.push(like(skus.skuCode, `%${filters.sku}%`));
      }
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      return await baseQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      );
    }

    return await baseQuery;
  },

  /**
   * Get all brands
   */
  getAllBrands: async () => {
    const db = getDb();
    return await db.select().from(brands);
  },

  /**
   * Get all categories
   */
  getAllCategories: async () => {
    const db = getDb();
    return await db.select().from(categories);
  },

  /**
   * Get all subCategories
   */
  getAllSubCategories: async () => {
    const db = getDb();
    return await db.select().from(subCategories);
  },

  /**
   * Get all segments
   */
  getAllSegments: async () => {
    const db = getDb();
    return await db.select().from(segments);
  },

  /**
   * Get all SKUs (standalone, no product reference needed)
   */
  getAllSkus: async () => {
    const db = getDb();
    return await db.select().from(skus);
  },
};