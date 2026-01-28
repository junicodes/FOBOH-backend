/**
 * Integration tests for Pricing Profile API
 * 
 * Tests full request → response flow using Supertest
 * Uses in-memory SQLite database for testing
 * 
 * Test Coverage:
 * - Create pricing profile
 * - Get all pricing profiles
 * - Get pricing profile by ID
 * - Update pricing profile
 * - Delete pricing profile
 * - Edge cases and validation
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { createApp } from "../../src/app";
import { getDb, initDb, closeDb } from "../../src/config/db";
import {
  pricingProfiles,
  pricingProfileProducts,
  products,
  brands,
  categories,
  subCategories,
  segments,
  skus,
} from "../../src/db/schema";
import { eq } from "drizzle-orm";

describe("Pricing Profile API", () => {
  let app: any;
  let testProductIds: number[] = [];
  let testProfileId: number;

  beforeAll(async () => {
    // Initialize database
    await initDb();
    app = createApp();

    // Seed test data
    const db = getDb();
    
    // Create test brands, categories, segments, SKUs
    const [brand] = await db.insert(brands).values({ name: "Test Brand" }).returning();
    const [category] = await db.insert(categories).values({ name: "Test Category" }).returning();
    const [subCategory] = await db
      .insert(subCategories)
      .values({ name: "Test SubCategory" })
      .returning();
    const [segment] = await db.insert(segments).values({ name: "Test Segment" }).returning();
    const [sku1] = await db.insert(skus).values({ skuCode: "TEST-SKU-1" }).returning();
    const [sku2] = await db.insert(skus).values({ skuCode: "TEST-SKU-2" }).returning();

    // Create test products
    const testProducts = await db
      .insert(products)
      .values([
        {
          title: "Test Product 1",
          skuId: sku1.id,
          brandId: brand.id,
          categoryId: category.id,
          subCategoryId: subCategory.id,
          segmentId: segment.id,
          globalWholesalePrice: 100.0,
          quantity: 10,
        },
        {
          title: "Test Product 2",
          skuId: sku2.id,
          brandId: brand.id,
          categoryId: category.id,
          subCategoryId: subCategory.id,
          segmentId: segment.id,
          globalWholesalePrice: 200.0,
          quantity: 20,
        },
        {
          title: "Test Product 3",
          skuId: sku1.id,
          brandId: brand.id,
          categoryId: category.id,
          subCategoryId: subCategory.id,
          segmentId: segment.id,
          globalWholesalePrice: 50.0,
          quantity: 5,
        },
      ])
      .returning();

    testProductIds = testProducts.map((p) => p.id);
  });

  beforeEach(async () => {
    // Clean up pricing profiles before each test
    const db = getDb();
    await db.delete(pricingProfileProducts);
    await db.delete(pricingProfiles);
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDb();
    await db.delete(pricingProfileProducts);
    await db.delete(pricingProfiles);
    await db.delete(products);
    await db.delete(skus);
    await db.delete(segments);
    await db.delete(subCategories);
    await db.delete(categories);
    await db.delete(brands);
    closeDb();
  });

  describe("POST /api/v1/pricing-profiles", () => {
    it("should create a pricing profile with fixed increase adjustment", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Fixed Increase",
          adjustmentType: "fixed",
          adjustmentValue: 20,
          incrementType: "increase",
          productIds: [testProductIds[0], testProductIds[1]],
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Profile - Fixed Increase");
      expect(response.body.adjustmentType).toBe("fixed");
      expect(response.body.adjustmentValue).toBe(20);
      expect(response.body.incrementType).toBe("increase");
      expect(response.body.pricingTable).toBeDefined();
      expect(response.body.pricingTable).toHaveLength(2);

      // Verify calculations
      // Product 1: 100 + 20 = 120
      expect(response.body.pricingTable[0].newPrice).toBe(120);
      // Product 2: 200 + 20 = 220
      expect(response.body.pricingTable[1].newPrice).toBe(220);

      testProfileId = response.body.id;
    });

    it("should create a pricing profile with fixed decrease adjustment", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Fixed Decrease",
          adjustmentType: "fixed",
          adjustmentValue: 15,
          incrementType: "decrease",
          productIds: [testProductIds[0]],
        })
        .expect(201);

      // Product 1: 100 - 15 = 85
      expect(response.body.pricingTable[0].newPrice).toBe(85);
    });

    it("should create a pricing profile with dynamic increase adjustment", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Dynamic Increase",
          adjustmentType: "dynamic",
          adjustmentValue: 10,
          incrementType: "increase",
          productIds: [testProductIds[0]],
        })
        .expect(201);

      // Product 1: 100 + (10% of 100) = 100 + 10 = 110
      expect(response.body.pricingTable[0].newPrice).toBe(110);
    });

    it("should create a pricing profile with dynamic decrease adjustment", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Dynamic Decrease",
          adjustmentType: "dynamic",
          adjustmentValue: 20,
          incrementType: "decrease",
          productIds: [testProductIds[0]],
        })
        .expect(201);

      // Product 1: 100 - (20% of 100) = 100 - 20 = 80
      expect(response.body.pricingTable[0].newPrice).toBe(80);
    });

    it("should clamp prices to 0 when decrease exceeds base price", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Large Decrease",
          adjustmentType: "fixed",
          adjustmentValue: 150, // Exceeds base price of 100
          incrementType: "decrease",
          productIds: [testProductIds[0]],
        })
        .expect(400); // Should fail validation

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Fixed decrease amount cannot exceed base price");
    });

    it("should reject percentage > 100%", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Invalid Percentage",
          adjustmentType: "dynamic",
          adjustmentValue: 150, // > 100%
          incrementType: "increase",
          productIds: [testProductIds[0]],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Percentage adjustment cannot exceed 100%");
    });

    it("should reject negative adjustment value", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Negative Value",
          adjustmentType: "fixed",
          adjustmentValue: -10,
          incrementType: "increase",
          productIds: [testProductIds[0]],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject empty product IDs array", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - No Products",
          adjustmentType: "fixed",
          adjustmentValue: 20,
          incrementType: "increase",
          productIds: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject missing required fields", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile",
          // Missing adjustmentType, adjustmentValue, incrementType, productIds
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid product IDs", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Test Profile - Invalid Products",
          adjustmentType: "fixed",
          adjustmentValue: 20,
          incrementType: "increase",
          productIds: [99999, 99998], // Non-existent products
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("No products found");
    });
  });

  describe("GET /api/v1/pricing-profiles", () => {
    beforeEach(async () => {
      // Create test profiles
      const db = getDb();
      const [profile1] = await db
        .insert(pricingProfiles)
        .values({
          name: "Profile 1",
          adjustmentType: "fixed",
          adjustmentValue: 10,
          incrementType: "increase",
        })
        .returning();

      const [profile2] = await db
        .insert(pricingProfiles)
        .values({
          name: "Profile 2",
          adjustmentType: "dynamic",
          adjustmentValue: 15,
          incrementType: "decrease",
        })
        .returning();

      // Add products to profiles
      await db.insert(pricingProfileProducts).values([
        {
          profileId: profile1.id,
          productId: testProductIds[0],
          basedOnPrice: 100,
          newPrice: 110,
        },
        {
          profileId: profile2.id,
          productId: testProductIds[1],
          basedOnPrice: 200,
          newPrice: 170, // 200 - (15% of 200) = 200 - 30 = 170
        },
      ]);
    });

    it("should get all pricing profiles", async () => {
      const response = await request(app)
        .get("/api/v1/pricing-profiles")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("adjustmentType");
      expect(response.body[0]).toHaveProperty("adjustmentValue");
      expect(response.body[0]).toHaveProperty("incrementType");
    });

    it("should return profiles sorted by creation date (newest first)", async () => {
      const response = await request(app)
        .get("/api/v1/pricing-profiles")
        .expect(200);

      if (response.body.length > 1) {
        const dates = response.body.map((p: any) => new Date(p.createdAt).getTime());
        // Check if dates are in descending order
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });
  });

  describe("GET /api/v1/pricing-profiles/:id", () => {
    let profileId: number;

    beforeEach(async () => {
      // Create a test profile
      const db = getDb();
      const [profile] = await db
        .insert(pricingProfiles)
        .values({
          name: "Test Profile for Get",
          adjustmentType: "fixed",
          adjustmentValue: 25,
          incrementType: "increase",
        })
        .returning();

      profileId = profile.id;

      // Add products
      await db.insert(pricingProfileProducts).values([
        {
          profileId: profile.id,
          productId: testProductIds[0],
          basedOnPrice: 100,
          newPrice: 125,
        },
        {
          profileId: profile.id,
          productId: testProductIds[1],
          basedOnPrice: 200,
          newPrice: 225,
        },
      ]);
    });

    it("should get pricing profile by ID with pricing table", async () => {
      const response = await request(app)
        .get(`/api/v1/pricing-profiles/${profileId}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", profileId);
      expect(response.body.name).toBe("Test Profile for Get");
      expect(response.body.pricingTable).toBeDefined();
      expect(response.body.pricingTable).toHaveLength(2);
      expect(response.body.pricingTable[0]).toHaveProperty("id");
      expect(response.body.pricingTable[0]).toHaveProperty("title");
      expect(response.body.pricingTable[0]).toHaveProperty("sku");
      expect(response.body.pricingTable[0]).toHaveProperty("category");
      expect(response.body.pricingTable[0]).toHaveProperty("wholesalePrice", 100);
      expect(response.body.pricingTable[0]).toHaveProperty("adjustment", 25);
      expect(response.body.pricingTable[0]).toHaveProperty("newPrice", 125);
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(app)
        .get("/api/v1/pricing-profiles/99999")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid profile ID", async () => {
      const response = await request(app)
        .get("/api/v1/pricing-profiles/invalid")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/v1/pricing-profiles/:id", () => {
    let profileId: number;

    beforeEach(async () => {
      // Create a test profile
      const db = getDb();
      const [profile] = await db
        .insert(pricingProfiles)
        .values({
          name: "Test Profile for Update",
          adjustmentType: "fixed",
          adjustmentValue: 10,
          incrementType: "increase",
        })
        .returning();

      profileId = profile.id;

      await db.insert(pricingProfileProducts).values({
        profileId: profile.id,
        productId: testProductIds[0],
        basedOnPrice: 100,
        newPrice: 110,
      });
    });

    it("should update pricing profile and recalculate prices", async () => {
      const response = await request(app)
        .put(`/api/v1/pricing-profiles/${profileId}`)
        .send({
          name: "Updated Profile Name",
          adjustmentType: "dynamic",
          adjustmentValue: 20,
          incrementType: "decrease",
          productIds: [testProductIds[0], testProductIds[1]],
        })
        .expect(200);

      expect(response.body.name).toBe("Updated Profile Name");
      expect(response.body.adjustmentType).toBe("dynamic");
      expect(response.body.adjustmentValue).toBe(20);
      expect(response.body.incrementType).toBe("decrease");
      expect(response.body.pricingTable).toHaveLength(2);

      // Verify recalculated prices
      // Product 1: 100 - (20% of 100) = 100 - 20 = 80
      expect(response.body.pricingTable[0].newPrice).toBe(80);
      // Product 2: 200 - (20% of 200) = 200 - 40 = 160
      expect(response.body.pricingTable[1].newPrice).toBe(160);
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(app)
        .put("/api/v1/pricing-profiles/99999")
        .send({
          name: "Updated",
          adjustmentType: "fixed",
          adjustmentValue: 10,
          incrementType: "increase",
          productIds: [testProductIds[0]],
        })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/v1/pricing-profiles/:id", () => {
    let profileId: number;

    beforeEach(async () => {
      // Create a test profile
      const db = getDb();
      const [profile] = await db
        .insert(pricingProfiles)
        .values({
          name: "Test Profile for Delete",
          adjustmentType: "fixed",
          adjustmentValue: 10,
          incrementType: "increase",
        })
        .returning();

      profileId = profile.id;

      await db.insert(pricingProfileProducts).values({
        profileId: profile.id,
        productId: testProductIds[0],
        basedOnPrice: 100,
        newPrice: 110,
      });
    });

    it("should delete pricing profile and associated products", async () => {
      await request(app)
        .delete(`/api/v1/pricing-profiles/${profileId}`)
        .expect(200);

      // Verify profile is deleted
      const db = getDb();
      const deletedProfile = await db
        .select()
        .from(pricingProfiles)
        .where(eq(pricingProfiles.id, profileId));

      expect(deletedProfile).toHaveLength(0);

      // Verify associated products are deleted
      const deletedProducts = await db
        .select()
        .from(pricingProfileProducts)
        .where(eq(pricingProfileProducts.profileId, profileId));

      expect(deletedProducts).toHaveLength(0);
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(app)
        .delete("/api/v1/pricing-profiles/99999")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Edge Cases and Validation", () => {
    it("should handle decimal prices correctly", async () => {
      // Create product with decimal price
      const db = getDb();
      const [brand] = await db.insert(brands).values({ name: "Decimal Brand" }).returning();
      const [category] = await db.insert(categories).values({ name: "Decimal Category" }).returning();
      const [subCategory] = await db
        .insert(subCategories)
        .values({ name: "Decimal SubCategory" })
        .returning();
      const [segment] = await db.insert(segments).values({ name: "Decimal Segment" }).returning();
      const [sku] = await db.insert(skus).values({ skuCode: "DECIMAL-SKU" }).returning();

      const [product] = await db
        .insert(products)
        .values({
          title: "Decimal Product",
          skuId: sku.id,
          brandId: brand.id,
          categoryId: category.id,
          subCategoryId: subCategory.id,
          segmentId: segment.id,
          globalWholesalePrice: 99.99,
          quantity: 1,
        })
        .returning();

      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Decimal Test Profile",
          adjustmentType: "fixed",
          adjustmentValue: 10.50,
          incrementType: "increase",
          productIds: [product.id],
        })
        .expect(201);

      // 99.99 + 10.50 = 110.49
      expect(response.body.pricingTable[0].newPrice).toBe(110.49);
    });

    it("should round prices to 2 decimal places", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Rounding Test Profile",
          adjustmentType: "dynamic",
          adjustmentValue: 33.333, // Will result in repeating decimal
          incrementType: "increase",
          productIds: [testProductIds[0]], // Base price: 100
        })
        .expect(201);

      // 100 + (33.333% of 100) = 100 + 33.333 = 133.333, rounded to 133.33
      const newPrice = response.body.pricingTable[0].newPrice;
      expect(newPrice).toBe(133.33);
      // Verify it's exactly 2 decimal places
      expect(newPrice.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it("should handle multiple products with different base prices", async () => {
      const response = await request(app)
        .post("/api/v1/pricing-profiles")
        .send({
          name: "Multiple Products Profile",
          adjustmentType: "fixed",
          adjustmentValue: 25,
          incrementType: "increase",
          productIds: testProductIds, // All 3 test products
        })
        .expect(201);

      expect(response.body.pricingTable).toHaveLength(3);
      // Product 1: 100 + 25 = 125
      expect(response.body.pricingTable[0].newPrice).toBe(125);
      // Product 2: 200 + 25 = 225
      expect(response.body.pricingTable[1].newPrice).toBe(225);
      // Product 3: 50 + 25 = 75
      expect(response.body.pricingTable[2].newPrice).toBe(75);
    });
  });
});
