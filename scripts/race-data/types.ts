/**
 * Types for race data collection and scraping
 */

import type { RaceItem } from "@/lib/types";

/**
 * Raw race data from external sources before transformation
 */
export interface RawRaceData {
  externalId: string;
  name: string;
  date: string | Date;
  city: string;
  state: string;
  country?: string;
  distance: "sprint" | "olympic" | "half" | "full";
  registrationCost?: number;
  registrationUrl?: string;
  raceWebsiteUrl?: string;
  organizerSeries?: string;

  // Course details
  swimDistanceMeters?: number;
  bikeDistanceMeters?: number;
  runDistanceMeters?: number;
  elevationGainMeters?: number;
  terrain?: "road" | "trail" | "mixed";
  waterType?: "ocean" | "lake" | "river" | "reservoir";

  // Additional details
  isQualifier?: boolean;
  qualifierFor?: string;
  registrationStatus?: "open" | "closed" | "waitlist" | "sold-out";
  maxCapacity?: number;

  // Source tracking
  sourceUrl?: string;
}

/**
 * Data source adapter interface
 */
export interface RaceDataSource {
  name: string;
  sourceUrl: string;

  /**
   * Fetch races from the data source
   */
  fetchRaces(): Promise<RawRaceData[]>;

  /**
   * Transform raw data to RaceItem format
   */
  transformToRaceItem(rawData: RawRaceData): Partial<RaceItem>;

  /**
   * Check if a race should be updated based on last scrape time
   */
  shouldUpdate(lastScraped?: Date): boolean;
}

/**
 * Result of a data sync operation
 */
export interface SyncResult {
  source: string;
  timestamp: Date;
  racesAdded: number;
  racesUpdated: number;
  racesSkipped: number;
  errors: Array<{
    raceId?: string;
    message: string;
  }>;
}
