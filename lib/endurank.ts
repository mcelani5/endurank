import { EndurankInput, CostSensitivity } from "./types";

// Endurank Formula:
// Endurank = (W_R × R_weighted) + (W_P × (1 - C) × R_weighted) - (W_C × C × P_norm)
//
// Where:
// - R_weighted: Average 5-star rating (weighted by reviewer tier)
// - C: User's Cost Sensitivity factor (0-1)
// - P_norm: Normalized Price (0-1, relative to category max)
// - W_R, W_P, W_C: Tunable weights (default: 0.6, 0.3, 0.1)

const W_R = 0.6; // Weight for rating
const W_P = 0.3; // Weight for value (performance at low cost)
const W_C = 0.1; // Weight for cost penalty

/**
 * Convert CostSensitivity enum to numeric factor (0-1)
 * - economy: 1.0 (very cost-sensitive, avoid expensive items)
 * - mid-range: 0.5 (balanced)
 * - performance: 0.0 (not cost-sensitive, prioritize quality)
 */
export function getCostSensitivityFactor(
  costSensitivity: CostSensitivity
): number {
  const mapping: Record<CostSensitivity, number> = {
    economy: 1.0,
    "mid-range": 0.5,
    performance: 0.0,
  };
  return mapping[costSensitivity];
}

/**
 * Calculate normalized price (0-1) for an item within its category
 * @param price - Item's price
 * @param categoryMaxPrice - Maximum price in the category
 * @returns Normalized price between 0 and 1
 */
export function calculateNormalizedPrice(
  price: number,
  categoryMaxPrice: number
): number {
  if (categoryMaxPrice === 0) return 0;
  return Math.min(price / categoryMaxPrice, 1);
}

/**
 * Calculate the personalized Endurank score for a product/race
 * @param input - Endurank calculation inputs
 * @returns Endurank value (typically 0-10, can be scaled)
 */
export function calculateEndurank(input: EndurankInput): number {
  const { averageRating, costSensitivity, normalizedPrice } = input;

  // Formula components
  const ratingComponent = W_R * averageRating;
  const valueComponent = W_P * (1 - costSensitivity) * averageRating;
  const costPenalty = W_C * costSensitivity * normalizedPrice;

  const endurank = ratingComponent + valueComponent - costPenalty;

  // Scale from 0-5 to 0-10 for better display
  const scaledScore = (endurank / 5) * 10;

  // Round to 1 decimal place
  return Math.round(scaledScore * 10) / 10;
}

/**
 * Calculate weighted average rating based on reviewer tiers
 * @param ratings - Array of {rating, tierWeight} objects
 * @returns Weighted average rating
 */
export function calculateWeightedRating(
  ratings: Array<{ rating: number; tierWeight: number }>
): number {
  if (ratings.length === 0) return 0;

  const totalWeighted = ratings.reduce(
    (sum, r) => sum + r.rating * r.tierWeight,
    0
  );
  const totalWeight = ratings.reduce((sum, r) => sum + r.tierWeight, 0);

  return totalWeight > 0 ? totalWeighted / totalWeight : 0;
}
