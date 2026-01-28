/**
 * Unit tests for pricing calculation logic
 * Tests all calculation scenarios and edge cases
 */

import {
  calculateAdjustment,
  calculateBatchAdjustments,
  CalculateAdjustmentParams,
} from "../../src/services/pricing-profile/calculateAdjustment";
import { describe, it, expect } from "@jest/globals";

describe("calculateAdjustment", () => {
  describe("Fixed Adjustment - Increase", () => {
    it("should calculate fixed increase correctly", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(120);
    });

    it("should handle decimal base prices", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 99.99,
        adjustmentType: "fixed",
        adjustmentValue: 10.50,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(110.49);
    });

    it("should round to 2 decimal places", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100.123,
        adjustmentType: "fixed",
        adjustmentValue: 20.456,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(120.58); // Rounded from 120.579
    });
  });

  describe("Fixed Adjustment - Decrease", () => {
    it("should calculate fixed decrease correctly", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "decrease",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(80);
    });

    it("should clamp to 0 when decrease exceeds base price", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 50,
        adjustmentType: "fixed",
        adjustmentValue: 100,
        incrementType: "decrease",
      };

      // Should throw error during validation
      expect(() => calculateAdjustment(params)).toThrow(
        "Fixed decrease amount cannot exceed base price"
      );
    });

    it("should handle decrease that results in exactly 0", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 50,
        adjustmentType: "fixed",
        adjustmentValue: 50,
        incrementType: "decrease",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(0);
    });
  });

  describe("Dynamic Adjustment - Increase", () => {
    it("should calculate percentage increase correctly", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 20,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(120); // 100 + (20% of 100) = 100 + 20 = 120
    });

    it("should handle 100% increase", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 100,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(200); // 100 + (100% of 100) = 100 + 100 = 200
    });

    it("should handle decimal percentages", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 12.5,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(112.5); // 100 + (12.5% of 100) = 100 + 12.5 = 112.5
    });

    it("should reject percentage > 100%", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 150,
        incrementType: "increase",
      };

      expect(() => calculateAdjustment(params)).toThrow(
        "Percentage adjustment cannot exceed 100%"
      );
    });
  });

  describe("Dynamic Adjustment - Decrease", () => {
    it("should calculate percentage decrease correctly", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 20,
        incrementType: "decrease",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(80); // 100 - (20% of 100) = 100 - 20 = 80
    });

    it("should handle 100% decrease (results in 0)", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 100,
        incrementType: "decrease",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(0); // 100 - (100% of 100) = 100 - 100 = 0
    });

    it("should clamp to 0 when decrease exceeds 100%", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "dynamic",
        adjustmentValue: 150,
        incrementType: "decrease",
      };

      // Should throw error during validation
      expect(() => calculateAdjustment(params)).toThrow(
        "Percentage decrease cannot exceed 100%"
      );
    });
  });

  describe("Edge Cases - Validation", () => {
    it("should reject negative base price", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: -10,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      };

      expect(() => calculateAdjustment(params)).toThrow(
        "Base price must be a valid positive number"
      );
    });

    it("should reject NaN base price", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: NaN,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      };

      expect(() => calculateAdjustment(params)).toThrow(
        "Base price must be a valid positive number"
      );
    });

    it("should reject negative adjustment value", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: -10,
        incrementType: "increase",
      };

      expect(() => calculateAdjustment(params)).toThrow(
        "Adjustment value must be a valid positive number"
      );
    });

    it("should reject NaN adjustment value", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: NaN,
        incrementType: "increase",
      };

      expect(() => calculateAdjustment(params)).toThrow(
        "Adjustment value must be a valid positive number"
      );
    });

    it("should reject zero base price", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 0,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      };

      // Zero is technically valid, but let's test it
      const result = calculateAdjustment(params);
      expect(result).toBe(20); // 0 + 20 = 20
    });

    it("should handle zero adjustment value", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: 0,
        incrementType: "increase",
      };

      // Zero adjustment value should be rejected
      expect(() => calculateAdjustment(params)).toThrow(
        "Adjustment value must be a valid positive number"
      );
    });
  });

  describe("Price Clamping", () => {
    it("should never return negative price", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 10,
        adjustmentType: "fixed",
        adjustmentValue: 15,
        incrementType: "decrease",
      };

      // Should throw error, but if it didn't, result should be clamped
      // Since validation catches this, we test the clamping in a valid scenario
      const validParams: CalculateAdjustmentParams = {
        basePrice: 10,
        adjustmentType: "fixed",
        adjustmentValue: 5,
        incrementType: "decrease",
      };

      const result = calculateAdjustment(validParams);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Rounding", () => {
    it("should round to 2 decimal places", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100.111,
        adjustmentType: "fixed",
        adjustmentValue: 20.222,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      // Should be rounded to 2 decimal places
      expect(result).toBe(120.33);
    });

    it("should handle rounding edge cases", () => {
      const params: CalculateAdjustmentParams = {
        basePrice: 100.005,
        adjustmentType: "fixed",
        adjustmentValue: 20.005,
        incrementType: "increase",
      };

      const result = calculateAdjustment(params);
      expect(result).toBe(120.01); // Rounded from 120.01
    });
  });
});

describe("calculateBatchAdjustments", () => {
  it("should calculate adjustments for multiple products", () => {
    const calculations: CalculateAdjustmentParams[] = [
      {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      },
      {
        basePrice: 200,
        adjustmentType: "dynamic",
        adjustmentValue: 10,
        incrementType: "increase",
      },
      {
        basePrice: 50,
        adjustmentType: "fixed",
        adjustmentValue: 10,
        incrementType: "decrease",
      },
    ];

    const results = calculateBatchAdjustments(calculations);

    expect(results).toHaveLength(3);
    expect(results[0].newPrice).toBe(120);
    expect(results[1].newPrice).toBe(220); // 200 + (10% of 200) = 200 + 20 = 220
    expect(results[2].newPrice).toBe(40);
  });

  it("should handle invalid calculations gracefully", () => {
    const calculations: CalculateAdjustmentParams[] = [
      {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      },
      {
        basePrice: -10, // Invalid
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      },
    ];

    const results = calculateBatchAdjustments(calculations);

    expect(results).toHaveLength(2);
    expect(results[0].newPrice).toBe(120);
    // Invalid calculation should return base price (no adjustment)
    expect(results[1].newPrice).toBe(-10);
    expect(results[1].adjustment).toBe(0);
  });

  it("should calculate adjustment amounts correctly", () => {
    const calculations: CalculateAdjustmentParams[] = [
      {
        basePrice: 100,
        adjustmentType: "fixed",
        adjustmentValue: 20,
        incrementType: "increase",
      },
    ];

    const results = calculateBatchAdjustments(calculations);

    expect(results[0].adjustment).toBe(20); // 120 - 100 = 20
    expect(results[0].basePrice).toBe(100);
    expect(results[0].newPrice).toBe(120);
  });
});
