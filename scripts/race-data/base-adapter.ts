/**
 * Base adapter class for race data sources
 */

import type { RaceDataSource, RawRaceData } from "./types";
import type { RaceItem } from "@/lib/types";

export abstract class BaseRaceAdapter implements RaceDataSource {
  abstract name: string;
  abstract sourceUrl: string;

  /**
   * Fetch races from the data source
   * Must be implemented by child classes
   */
  abstract fetchRaces(): Promise<RawRaceData[]>;

  /**
   * Transform raw race data to RaceItem format
   */
  transformToRaceItem(rawData: RawRaceData): Partial<RaceItem> {
    const raceDate = typeof rawData.date === 'string'
      ? new Date(rawData.date)
      : rawData.date;

    return {
      raceName: rawData.name,
      raceDate,
      location: {
        city: rawData.city,
        state: rawData.state,
        country: rawData.country || "USA",
        region: this.getRegion(rawData.state),
      },
      distance: rawData.distance,
      msrp: rawData.registrationCost || 0,
      course: {
        swimDistance: rawData.swimDistanceMeters,
        bikeDistance: rawData.bikeDistanceMeters,
        runDistance: rawData.runDistanceMeters,
        elevationGain: rawData.elevationGainMeters,
        terrain: rawData.terrain,
        waterType: rawData.waterType,
      },
      organizerSeries: rawData.organizerSeries,
      registrationUrl: rawData.registrationUrl,
      raceWebsiteUrl: rawData.raceWebsiteUrl,
      registrationStatus: rawData.registrationStatus,
      maxCapacity: rawData.maxCapacity,
      isQualifier: rawData.isQualifier,
      qualifierFor: rawData.qualifierFor,

      // Default review values for new races
      avgCourseRating: 0,
      avgCostRating: 0,
      avgVolunteersRating: 0,
      avgSpectatorRating: 0,
      averageRating: 0,
      totalReviewsCount: 0,

      // Data source tracking
      dataSource: this.name,
      externalId: rawData.externalId,
      lastScraped: new Date(),
      status: "live", // Auto-approve scraped races
    };
  }

  /**
   * Check if a race should be updated
   * Default: update if not scraped in the last 7 days
   */
  shouldUpdate(lastScraped?: Date): boolean {
    if (!lastScraped) return true;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return lastScraped < weekAgo;
  }

  /**
   * Map US state to region
   */
  protected getRegion(state: string): string {
    const regions: Record<string, string> = {
      // West Coast
      'CA': 'West Coast',
      'OR': 'West Coast',
      'WA': 'West Coast',

      // Southwest
      'AZ': 'Southwest',
      'NM': 'Southwest',
      'NV': 'Southwest',
      'UT': 'Southwest',
      'CO': 'Southwest',

      // Midwest
      'IL': 'Midwest',
      'IN': 'Midwest',
      'IA': 'Midwest',
      'KS': 'Midwest',
      'MI': 'Midwest',
      'MN': 'Midwest',
      'MO': 'Midwest',
      'NE': 'Midwest',
      'ND': 'Midwest',
      'OH': 'Midwest',
      'SD': 'Midwest',
      'WI': 'Midwest',

      // Southeast
      'AL': 'Southeast',
      'AR': 'Southeast',
      'FL': 'Southeast',
      'GA': 'Southeast',
      'KY': 'Southeast',
      'LA': 'Southeast',
      'MS': 'Southeast',
      'NC': 'Southeast',
      'SC': 'Southeast',
      'TN': 'Southeast',
      'VA': 'Southeast',
      'WV': 'Southeast',

      // Northeast
      'CT': 'Northeast',
      'DE': 'Northeast',
      'ME': 'Northeast',
      'MD': 'Northeast',
      'MA': 'Northeast',
      'NH': 'Northeast',
      'NJ': 'Northeast',
      'NY': 'Northeast',
      'PA': 'Northeast',
      'RI': 'Northeast',
      'VT': 'Northeast',

      // Mountain West
      'ID': 'Mountain West',
      'MT': 'Mountain West',
      'WY': 'Mountain West',

      // Texas
      'TX': 'Texas',

      // Hawaii & Alaska
      'HI': 'Hawaii',
      'AK': 'Alaska',
    };

    return regions[state] || 'Other';
  }

  /**
   * Generate a consistent race ID from race details
   */
  protected generateRaceId(name: string, state: string, distance: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${normalized}-${state.toLowerCase()}-${distance}`;
  }
}
