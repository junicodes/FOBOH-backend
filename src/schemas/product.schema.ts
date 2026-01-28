import { z } from "zod";

/**
 * Product validation schemas
 * Zod schemas for request validation
 */
export const productSchemas = {
  search: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    segment: z.string().optional(),
    brand: z.string().optional(),
  }),
};