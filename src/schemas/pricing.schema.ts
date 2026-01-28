import { z } from "zod";

/**
 * Pricing validation schemas
 * Zod schemas for request validation
 */
export const pricingSchemas = {
  calculate: z.object({
    productIds: z.array(z.number().int().positive()),
    basedOnProfileId: z.number().int().positive().nullable().optional(),
    adjustmentType: z.enum(["fixed", "dynamic"]),
    adjustmentValue: z.number().positive(),
    incrementType: z.enum(["increase", "decrease"]),
  })
};