import { Router } from "express";
import { productController } from "../../controllers/products/product.controller";

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product title or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
const router = Router();

// Product routes
router.get("/", productController.getAll);
router.get("/search", productController.search);

// Reference data routes
/**
 * @swagger
 * /api/v1/products/brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all brands
 */
router.get("/brands", productController.getAllBrands);

/**
 * @swagger
 * /api/v1/products/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all categories
 */
router.get("/categories", productController.getAllCategories);

/**
 * @swagger
 * /api/v1/products/sub-categories:
 *   get:
 *     summary: Get all sub-categories
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all sub-categories
 */
router.get("/sub-categories", productController.getAllSubCategories);

/**
 * @swagger
 * /api/v1/products/segments:
 *   get:
 *     summary: Get all segments
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all segments
 */
router.get("/segments", productController.getAllSegments);

/**
 * @swagger
 * /api/v1/products/skus:
 *   get:
 *     summary: Get all SKUs
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all SKUs
 */
router.get("/skus", productController.getAllSkus);

export default router;