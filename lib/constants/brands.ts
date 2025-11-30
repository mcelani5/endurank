/**
 * Controlled brand lists for data integrity
 * These must be selected from dropdowns - no free-form entry
 */

export const BIKE_BRANDS = [
  "Cervélo",
  "Canyon",
  "Specialized",
  "Trek",
  "Cannondale",
  "Felt",
  "Scott",
  "BMC",
  "Quintana Roo",
  "Argon 18",
  "Orbea",
  "Giant",
  "Cube",
  "Pinarello",
  "Colnago",
].sort();

export const RUNNING_SHOE_BRANDS = [
  "Nike",
  "ASICS",
  "Hoka",
  "Brooks",
  "Saucony",
  "New Balance",
  "Altra",
  "On Running",
  "Mizuno",
  "Adidas",
  "Salomon",
  "Topo Athletic",
].sort();

export const NUTRITION_BRANDS = [
  "Maurten",
  "GU",
  "Skratch Labs",
  "Science in Sport (SiS)",
  "Clif Bar",
  "Honey Stinger",
  "PowerBar",
  "Spring Energy",
  "Tailwind Nutrition",
  "UCAN",
  "Precision Hydration",
  "SaltStick",
].sort();

export const ALL_BRANDS = [...BIKE_BRANDS, ...RUNNING_SHOE_BRANDS, ...NUTRITION_BRANDS].sort();

export function getBrandsForCategory(category: string): string[] {
  switch (category) {
    case "bikes":
      return BIKE_BRANDS;
    case "running-shoes":
      return RUNNING_SHOE_BRANDS;
    case "nutrition":
      return NUTRITION_BRANDS;
    default:
      return ALL_BRANDS;
  }
}
