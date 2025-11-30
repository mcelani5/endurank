/**
 * Utility functions for price tier display
 */

export type PriceTier = "budget" | "mid" | "premium";

/**
 * Get price tier based on price and category
 */
export function getPriceTier(price: number, category: "gear" | "race"): PriceTier {
  if (category === "gear") {
    if (price < 100) return "budget";
    if (price < 1000) return "mid";
    return "premium";
  } else {
    // race
    if (price < 150) return "budget";
    if (price < 500) return "mid";
    return "premium";
  }
}

/**
 * Get price tier display ($ icons)
 */
export function getPriceTierDisplay(tier: PriceTier): string {
  switch (tier) {
    case "budget":
      return "$";
    case "mid":
      return "$$";
    case "premium":
      return "$$$";
  }
}

/**
 * Get Endurank color based on score
 * Higher scores get more vibrant colors
 */
export function getEndurankColor(score: number): string {
  if (score >= 8.5) return "text-green-600 dark:text-green-400";
  if (score >= 7.0) return "text-blue-600 dark:text-blue-400";
  if (score >= 5.5) return "text-yellow-600 dark:text-yellow-500";
  return "text-orange-600 dark:text-orange-400";
}

/**
 * Get Endurank background color based on score
 */
export function getEndurankBgColor(score: number): string {
  if (score >= 8.5) return "bg-green-50 dark:bg-green-950";
  if (score >= 7.0) return "bg-blue-50 dark:bg-blue-950";
  if (score >= 5.5) return "bg-yellow-50 dark:bg-yellow-950";
  return "bg-orange-50 dark:bg-orange-950";
}
