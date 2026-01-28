import { Request, Response, NextFunction } from "express";
import { productService } from "../../services/products/product.service";

/**
 * Product controller
 * Request/response handling only
 */
export const productController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        category: req.query.category as string,
        subCategory: req.query.subCategory as string,
        segment: req.query.segment as string,
        brand: req.query.brand as string,
        search: req.query.search as string,
        sku: req.query.sku as string,
      };
      const dbProducts = await productService.getAll(filters);

      // Map backend product format to frontend format
      const products = dbProducts.map((product) => ({
        id: product.id,
        name: product.title,
        sku: product.skuCode || "",
        quantity: String(product.quantity || 1),
        brand: product.brandName || "",
        category: product.categoryName || "",
        subCategory: product.subCategoryName || "",
        segment: product.segmentName || "",
        globalWholesalePrice: product.globalWholesalePrice,
      }));

      // Return in the format expected by frontend
      res.json({
        products,
        total: products.length,
      });
    } catch (error) {
      next(error);
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query.q as string) || "";
      const filters = {
        category: req.query.category as string,
        subCategory: req.query.subCategory as string,
        segment: req.query.segment as string,
        brand: req.query.brand as string,
        sku: req.query.sku as string,
      };
      const dbProducts = await productService.search(query, filters);

      // Map backend product format to frontend format
      const products = dbProducts.map((product) => ({
        id: product.id,
        name: product.title,
        sku: product.skuCode || "",
        quantity: String(product.quantity || 1),
        brand: product.brandName || "",
        category: product.categoryName || "",
        subCategory: product.subCategoryName || "",
        segment: product.segmentName || "",
        globalWholesalePrice: product.globalWholesalePrice,
      }));

      // Return in the format expected by frontend
      res.json({
        products,
        total: products.length,
      });
    } catch (error) {
      next(error);
    }
  },

  getAllBrands: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = await productService.getAllBrands();
      res.json(brands);
    } catch (error) {
      next(error);
    }
  },

  getAllCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await productService.getAllCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  },

  getAllSubCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const subCategories = await productService.getAllSubCategories();
      res.json(subCategories);
    } catch (error) {
      next(error);
    }
  },

  getAllSegments: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const segments = await productService.getAllSegments();
      res.json(segments);
    } catch (error) {
      next(error);
    }
  },

  getAllSkus: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const skus = await productService.getAllSkus();
      res.json(skus);
    } catch (error) {
      next(error);
    }
  },
};