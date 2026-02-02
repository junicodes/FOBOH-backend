import { Request, Response, NextFunction } from "express";
import { PricingProfileService, pricingProfileService } from "../../services/pricing-profile/pricing-profile.service";

/**
 * Pricing Profile controller
 * Request/response handling only
 */
export class PricingProfileController {
  private pricingProfileService: PricingProfileService;

  constructor(pricingProfileService: PricingProfileService) {
    this.pricingProfileService = pricingProfileService;
  }

  /**
   * Create a new pricing profile
   * Calculates prices and returns pricing table data
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        adjustmentType,
        adjustmentValue,
        incrementType,
        productIds,
      } = req.body;

      if (!name || !adjustmentType || adjustmentValue === undefined || !incrementType || !productIds || !Array.isArray(productIds)) {
        return res.status(400).json({
          error: "Missing required fields: name, adjustmentType, adjustmentValue, incrementType, productIds",
        });
      }

      if (productIds.length === 0) {
        return res.status(400).json({
          error: "No products found for the provided product IDs",
        });
      }

      const profile = await this.pricingProfileService.createProfile({
        name,
        adjustmentType,
        adjustmentValue: parseFloat(adjustmentValue),
        incrementType,
        productIds,
      });

      return res.status(201).json(profile);
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg.includes("cannot exceed") ||
          msg.includes("must be a valid positive number") ||
          msg.includes("No products found") ||
          msg.includes("invalid base price")
        ) {
          return res.status(400).json({ error: msg });
        }
      }
      return next(error);
    }
  };

  /**
   * Get all pricing profiles
   */
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const profiles = await this.pricingProfileService.getAllProfiles();
      return res.json(profiles);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get pricing profile by ID
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      const profile = await this.pricingProfileService.getProfileById(id);
      return res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  };

  /**
   * Update pricing profile
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      const {
        name,
        adjustmentType,
        adjustmentValue,
        incrementType,
        productIds,
      } = req.body;

      const profile = await this.pricingProfileService.updateProfile(id, {
        name,
        adjustmentType,
        adjustmentValue: adjustmentValue !== undefined ? parseFloat(adjustmentValue) : undefined,
        incrementType,
        productIds,
      });

      return res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  };

  /**
   * Delete pricing profile
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      await this.pricingProfileService.deleteProfile(id);
      return res.json({ success: true, message: "Pricing profile deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  };
}

// Export singleton instance
export const pricingProfileController = new PricingProfileController(
  pricingProfileService
);