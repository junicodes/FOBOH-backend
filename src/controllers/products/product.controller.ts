import { Request, Response, NextFunction } from "express";
import { ProductService, productService } from "../../services/products/product.service";

/**
 * Product controller
 * Request/response handling only
 */
export class ProductController {
  private productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        category: req.query.category as string,
        subCategory: req.query.subCategory as string,
        segment: req.query.segment as string,
        brand: req.query.brand as string,
        search: req.query.search as string,
        sku: req.query.sku as string,
      };
      const dbProducts = await this.productService.getAll(filters);

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
      return res.json({
        products,
        total: products.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query.q as string) || "";
      const filters = {
        category: req.query.category as string,
        subCategory: req.query.subCategory as string,
        segment: req.query.segment as string,
        brand: req.query.brand as string,
        sku: req.query.sku as string,
      };
      const dbProducts = await this.productService.search(query, filters);

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
      return res.json({
        products,
        total: products.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  getAllBrands = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = await this.productService.getAllBrands();
      return res.json(brands);
    } catch (error) {
      return next(error);
    }
  };

  getAllCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.productService.getAllCategories();
      return res.json(categories);
    } catch (error) {
      return next(error);
    }
  };

  getAllSubCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const subCategories = await this.productService.getAllSubCategories();
      return res.json(subCategories);
    } catch (error) {
      return next(error);
    }
  };

  getAllSegments = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const segments = await this.productService.getAllSegments();
      return res.json(segments);
    } catch (error) {
      return next(error);
    }
  };

  getAllSkus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const skus = await this.productService.getAllSkus();
      return res.json(skus);
    } catch (error) {
      return next(error);
    }
  };
}

// Export singleton instance
export const productController = new ProductController(productService);