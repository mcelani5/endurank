/**
 * Fuzzy matching utility for detecting similar item names
 * Uses Levenshtein distance for similarity calculation
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 * Higher percentage means more similar
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Check if two strings are similar enough to be considered duplicates
 * Default threshold is 85%
 */
export function isSimilar(
  str1: string,
  str2: string,
  threshold: number = 85
): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Find similar items from a list
 */
export function findSimilarItems<T extends { productName?: string; raceName?: string }>(
  searchTerm: string,
  items: T[],
  threshold: number = 85
): T[] {
  return items.filter((item) => {
    const itemName = item.productName || item.raceName || "";
    return isSimilar(searchTerm, itemName, threshold);
  });
}
