import { getDb, initDb } from "../../config/db";
import {
  brands,
  categories,
  subCategories,
  segments,
  skus,
  products,
  pricingProfileProducts,
  pricingProfiles,
  NewBrand,
  NewCategory,
  NewSubCategory,
  NewSegment,
  NewSku,
  NewProduct,
} from "../schemas/dev.schema";

/**
 * SQLite Seed script
 * Populates SQLite database with sample data in the correct order:
 * 1. Brands
 * 2. Categories
 * 3. SubCategories
 * 4. Segments
 * 5. SKUs (standalone)
 * 6. Products (using foreign keys, including SKU reference)
 * Run with: npm run seed (when NODE_ENV !== "production")
 */
export async function seedDatabase() {
  const db = getDb();

  // Clear existing data (in reverse order of dependencies)
  await db.delete(pricingProfileProducts);
  await db.delete(pricingProfiles);
  await db.delete(products);
  await db.delete(skus);
  await db.delete(segments);
  await db.delete(subCategories);
  await db.delete(categories);
  await db.delete(brands);

  // 1. Seed Brands
  const brandData: NewBrand[] = [
    { name: "High Garden" },
    { name: "Koyama Wines" },
    { name: "Lacourte-Godbillon" },
  ];

  const insertedBrands = await db.insert(brands).values(brandData).returning();
  console.log(`✅ Seeded ${insertedBrands.length} brands`);

  // Create brand lookup map
  const brandMap = new Map(insertedBrands.map((b: { name: any; id: any; }) => [b.name, b.id]));

  // 2. Seed Categories
  const categoryData: NewCategory[] = [{ name: "Alcoholic Beverage" }];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();
  console.log(`✅ Seeded ${insertedCategories.length} categories`);

  const categoryMap = new Map(
    insertedCategories.map((c: { name: any; id: any; }) => [c.name, c.id])
  );

  // 3. Seed SubCategories
  const subCategoryData: NewSubCategory[] = [{ name: "Wine" }];

  const insertedSubCategories = await db
    .insert(subCategories)
    .values(subCategoryData)
    .returning();
  console.log(`✅ Seeded ${insertedSubCategories.length} subCategories`);

  const subCategoryMap = new Map(
    insertedSubCategories.map((sc: { name: any; id: any; }) => [sc.name, sc.id])
  );

  // 4. Seed Segments
  const segmentData: NewSegment[] = [
    { name: "Red" },
    { name: "Sparkling" },
    { name: "Port/Dessert" },
    { name: "White" },
  ];

  const insertedSegments = await db
    .insert(segments)
    .values(segmentData)
    .returning();
  console.log(`✅ Seeded ${insertedSegments.length} segments`);

  const segmentMap = new Map(insertedSegments.map((s: { name: any; id: any; }) => [s.name, s.id]));

  // 5. Seed SKUs (standalone, no product reference)
  const skuData: NewSku[] = [
    { skuCode: "HGVPIN216" },
    { skuCode: "KOYBRUNV6" },
    { skuCode: "KOYNR1837" },
    { skuCode: "KOYRIE19" },
    { skuCode: "LACBNATNV6" },
  ];

  const insertedSkus = await db.insert(skus).values(skuData).returning();
  console.log(`✅ Seeded ${insertedSkus.length} SKUs`);

  // Create SKU lookup map
  const skuMap = new Map(insertedSkus.map((s: { skuCode: any; id: any; }) => [s.skuCode, s.id]));

  // 6. Seed Products (using foreign key IDs, including SKU reference)
  // Quantity is set to at least 1 or more
  const productData: NewProduct[] = [
    {
      title: "High Garden Pinot Noir 2021",
      skuId: Number(skuMap.get("HGVPIN216")),
      brandId: Number(brandMap.get("High Garden")),
      categoryId: Number(categoryMap.get("Alcoholic Beverage")),
      subCategoryId: Number(subCategoryMap.get("Wine")),
      segmentId: Number(segmentMap.get("Red")),
      globalWholesalePrice: 279.06,
      quantity: 45,
    },
    {
      title: "Koyama Methode Brut Nature NV",
      skuId: Number(skuMap.get("KOYBRUNV6")),
      brandId: Number(brandMap.get("Koyama Wines")),
      categoryId: Number(categoryMap.get("Alcoholic Beverage")),
      subCategoryId: Number(subCategoryMap.get("Wine")),
      segmentId: Number(segmentMap.get("Sparkling")),
      globalWholesalePrice: 120.0,
      quantity: 32,
    },
    {
      title: "Koyama Riesling 2018",
      skuId: Number(skuMap.get("KOYNR1837")),
      brandId: Number(brandMap.get("Koyama Wines")),
      categoryId: Number(categoryMap.get("Alcoholic Beverage")),
      subCategoryId: Number(subCategoryMap.get("Wine")),
      segmentId: Number(segmentMap.get("Port/Dessert")),
      globalWholesalePrice: 215.04,
      quantity: 28,
    },
    {
      title: "Koyama Tussock Riesling 2019",
      skuId: Number(skuMap.get("KOYRIE19")),
      brandId: Number(brandMap.get("Koyama Wines")),
      categoryId: Number(categoryMap.get("Alcoholic Beverage")),
      subCategoryId: Number(subCategoryMap.get("Wine")),
      segmentId: Number(segmentMap.get("White")),
      globalWholesalePrice: 215.04,
      quantity: 67,
    },
    {
      title: "Lacourte-Godbillon Brut Cru NV",
      skuId: Number(skuMap.get("LACBNATNV6")),
      brandId: Number(brandMap.get("Lacourte-Godbillon")),
      categoryId: Number(categoryMap.get("Alcoholic Beverage")),
      subCategoryId: Number(subCategoryMap.get("Wine")),
      segmentId: Number(segmentMap.get("Sparkling")),
      globalWholesalePrice: 409.32,
      quantity: 15,
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .returning();
  console.log(`✅ Seeded ${insertedProducts.length} products`);

  return {
    brands: insertedBrands,
    categories: insertedCategories,
    subCategories: insertedSubCategories,
    segments: insertedSegments,
    skus: insertedSkus,
    products: insertedProducts,
  };
}

// Run seed if executed directly
if (require.main === module) {
  (async () => {
    try {
      await initDb();
      await seedDatabase();
      console.log("✅ SQLite seed completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ SQLite seed failed:", error);
      process.exit(1);
    }
  })();
}
