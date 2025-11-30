// User Types
export type UserTier = "beginner" | "contributor" | "expert";
export type CostSensitivity = "economy" | "mid-range" | "performance";
export type RaceDistance = "sprint" | "olympic" | "half" | "full";
export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  reviewCount: number;
  tier: UserTier;
  isAdmin?: boolean; // Admin users can access moderation features
  // Onboarding data for TriScore personalization
  costSensitivity: CostSensitivity;
  preferredDistance: RaceDistance;
  skillLevel: SkillLevel;
  wishlist: string[]; // Array of product IDs
  createdAt: Date;
  updatedAt: Date;
}

// Item Status
export type ItemStatus = "pending" | "live" | "rejected";

// Gear Types
export type GearSubCategory = "bikes" | "running-shoes" | "nutrition";

export interface GearItem {
  productId: string;
  productName: string;
  brand: string;
  subCategory: GearSubCategory;
  msrp: number; // Used for P_norm calculation
  mpn?: string; // Manufacturer's Part Number / SKU (unique identifier)
  averageRating: number; // Weighted average using tier system
  totalReviewsCount: number;
  specs: Record<string, any>; // Flexible JSON map for product specs
  imageUrl?: string;
  status: ItemStatus; // Moderation status
  createdBy?: string; // User ID who created the item
  createdAt: Date;
  updatedAt: Date;
}

// Race Types
export type RegistrationStatus = "open" | "closed" | "waitlist" | "sold-out";
export type TerrainType = "road" | "trail" | "mixed";
export type WaterType = "ocean" | "lake" | "river" | "reservoir";

export interface RaceItem {
  // Core identification
  raceId: string;
  raceName: string;
  raceDate: Date;
  location: {
    city: string;
    state: string;
    country?: string;  // For international races
    region?: string;   // e.g., "West Coast", "Midwest"
  };
  distance: RaceDistance;
  msrp: number; // Registration cost

  // Course details
  course?: {
    swimDistance?: number;      // in meters
    bikeDistance?: number;      // in meters
    runDistance?: number;       // in meters
    elevationGain?: number;     // total in meters
    terrain?: TerrainType;
    waterType?: WaterType;
    laps?: {
      swim?: number;
      bike?: number;
      run?: number;
    };
  };

  // Race logistics
  organizerSeries?: string;     // e.g., "IRONMAN", "Challenge", "USA Triathlon"
  registrationUrl?: string;
  raceWebsiteUrl?: string;
  maxCapacity?: number;
  registrationStatus?: RegistrationStatus;

  // Environmental info
  altitude?: number;            // in meters
  typicalWeather?: string;      // e.g., "Warm, humid"

  // Special attributes
  isQualifier?: boolean;        // Qualifies for World Championship
  qualifierFor?: string;        // e.g., "IRONMAN World Championship"
  proPurse?: number;            // Prize money

  // Four required sub-ratings for races
  avgCourseRating: number;
  avgCostRating: number;
  avgVolunteersRating: number;
  avgSpectatorRating: number;
  averageRating: number; // Overall weighted average
  totalReviewsCount: number;

  // Media
  imageUrl?: string;

  // Moderation
  status: ItemStatus; // Moderation status
  createdBy?: string; // User ID who created the item

  // Data source tracking
  dataSource?: string;          // e.g., "ironman.com", "usatriathlon.org", "manual"
  lastScraped?: Date;           // When data was last updated from source
  externalId?: string;          // ID from source system

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export interface Review {
  reviewId: string;
  itemId: string; // References productId or raceId
  itemType: "gear" | "race";
  userId: string;
  userTier: UserTier; // Cached at time of review for weighting
  rating: number; // 1-5 stars
  title: string;
  text: string;
  // Race-specific sub-ratings (optional, only for races)
  raceSubRatings?: {
    course: number;
    cost: number;
    volunteers: number;
    spectators: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Imported Review Types (from scraped sources)
export interface ImportedReview {
  importedReviewId: string;
  itemId: string;
  itemType: "gear" | "race";
  sourceWebsite: string; // e.g., "Reddit", "SlowTwitch"
  sourceUrl: string;
  snippet: string; // Review excerpt
  author?: string; // Original author if available
  createdAt: Date;
}

// Endurank Calculation Types
export interface EndurankInput {
  averageRating: number; // R_weighted
  costSensitivity: number; // C (0-1)
  normalizedPrice: number; // P_norm (0-1)
}

// Tier Weights
export const TIER_WEIGHTS: Record<UserTier, number> = {
  beginner: 0.75,
  contributor: 1.0,
  expert: 1.25,
};

// Review count thresholds for tiers
export const TIER_THRESHOLDS = {
  beginner: { min: 0, max: 3 },
  contributor: { min: 4, max: 10 },
  expert: { min: 11, max: Infinity },
};
