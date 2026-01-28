import { Request, Response, NextFunction } from "express";
import { pricingProfileService } from "../../services/pricing-profile/pricing-profile.service";

/**
 * Pricing Profile controller
 * Request/response handling only
 */
export const pricingProfileController = {
  /**
   * Create a new pricing profile
   * Calculates prices and returns pricing table data
   */
  create: async (req: Request, res: Response, next: NextFunction) => {
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

      const profile = await pricingProfileService.createProfile({
        name,
        adjustmentType,
        adjustmentValue: parseFloat(adjustmentValue),
        incrementType,
        productIds,
      });

      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all pricing profiles
   */
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const profiles = await pricingProfileService.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get pricing profile by ID
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      const profile = await pricingProfileService.getProfileById(id);
      res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Update pricing profile
   */
  update: async (req: Request, res: Response, next: NextFunction) => {
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

      const profile = await pricingProfileService.updateProfile(id, {
        name,
        adjustmentType,
        adjustmentValue: adjustmentValue !== undefined ? parseFloat(adjustmentValue) : undefined,
        incrementType,
        productIds,
      });

      res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Delete pricing profile
   */
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      await pricingProfileService.deleteProfile(id);
      res.json({ success: true, message: "Pricing profile deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  },
};