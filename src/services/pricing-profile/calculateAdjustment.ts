import { clampPrice, roundPrice } from "../../utils/money";

/**
 * Formulas (matching requirements):
 * Fixed + Increase: [Based On Price] + [Adjustment] = [New Price]
 *   Example: $500.00 + $20.00 = $520.00
 * 
 * Fixed + Decrease: [Based On Price] - [Adjustment] = [New Price]
 *   Example: $500.00 - $20.00 = $480.00
 * 
 * Dynamic + Increase: [Based On Price] + ([Adjustment]% * [Based On Price]) = [New Price]
 *   Example: $500.00 + (20% of $500.00) = $500.00 + $100.00 = $600.00
 * 
 * Dynamic + Decrease: [Based On Price] - ([Adjustment]% * [Based On Price]) = [New Price]
 *   Example: $500.00 - (20% of $500.00) = $500.00 - $100.00 = $400.00
 */

export interface CalculateAdjustmentParams {
  basePrice: number;
  adjustmentType: "fixed" | "dynamic";
  adjustmentValue: number;
  incrementType: "increase" | "decrease";
}

export interface CalculateAdjustmentResult {
  basePrice: number;
  newPrice: number;
  adjustment: number;
  adjustmentType: "fixed" | "dynamic";
  adjustmentValue: number;
  incrementType: "increase" | "decrease";
}

/**
 * Validate calculation parameters
 * Throws error if invalid
 */
function validateCalculationParams(params: CalculateAdjustmentParams): void {
  const { basePrice, adjustmentType, adjustmentValue } = params;

  // Validate base price
  if (isNaN(basePrice) || basePrice < 0) {
    throw new Error("Base price must be a valid positive number");
  }

  // Validate adjustment value (must be positive, not zero)
  if (isNaN(adjustmentValue) || adjustmentValue <= 0) {
    throw new Error("Adjustment value must be a valid positive number");
  }

  // Validate dynamic percentage (should not exceed 100%)
  if (adjustmentType === "dynamic" && adjustmentValue > 100) {
    throw new Error("Percentage adjustment cannot exceed 100%");
  }

  // Validate that decrease won't result in negative price
  if (params.incrementType === "decrease") {
    if (adjustmentType === "fixed" && adjustmentValue > basePrice) {
      throw new Error("Fixed decrease amount cannot exceed base price");
    }
    if (adjustmentType === "dynamic" && adjustmentValue > 100) {
      throw new Error("Percentage decrease cannot exceed 100%");
    }
  }
}

/**
 * Calculate new price based on adjustment parameters
 * 
 * @param params - Pricing calculation parameters
 * @returns New calculated price (never negative)
 * @throws Error if validation fails
 */
export function calculateAdjustment(params: CalculateAdjustmentParams): number {
  // Validate parameters first
  validateCalculationParams(params);

  const { basePrice, adjustmentType, adjustmentValue, incrementType } = params;

  let newPrice: number;

  if (adjustmentType === "fixed") {
    // Fixed adjustment: Add or subtract the exact adjustment value
    if (incrementType === "increase") {
      newPrice = basePrice + adjustmentValue;
    } else {
      // decrease - ensure it doesn't go negative
      newPrice = Math.max(0, basePrice - adjustmentValue);
    }
  } else {
    // Dynamic (percentage) adjustment: Calculate percentage of base price first
    const adjustmentAmount = (adjustmentValue / 100) * basePrice;
    if (incrementType === "increase") {
      newPrice = basePrice + adjustmentAmount;
    } else {
      // decrease - ensure it doesn't go negative
      newPrice = Math.max(0, basePrice - adjustmentAmount);
    }
  }

  // Round to 2 decimal places and clamp to prevent negative prices
  return clampPrice(roundPrice(newPrice));
}

/**
 * Batch calculate prices for multiple products
 */
export function calculateBatchAdjustments(
  calculations: CalculateAdjustmentParams[]
): CalculateAdjustmentResult[] {
  return calculations.map((params) => {
    try {
      const newPrice = calculateAdjustment(params);
      return {
        ...params,
        basePrice: params.basePrice,
        newPrice,
        adjustment: newPrice - params.basePrice,
      };
    } catch (error) {
      // If calculation fails, return base price (no adjustment)
      return {
        ...params,
        basePrice: params.basePrice,
        newPrice: params.basePrice,
        adjustment: 0,
      };
    }
  });
}

// Adjustement is the delta increase or decrease between the base price and the new price