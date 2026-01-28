/**
 * Money utility functions
 * Rounding and clamping helpers for price calculations
 */

/**
 * Round price to 2 decimal places
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Clamp price to never be negative
 */
export function clampPrice(price: number, min: number = 0): number {
  return Math.max(price, min);
}

/**
 * Format price as currency string
 */
export function formatPrice(price: number, currency: string = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(price);
}