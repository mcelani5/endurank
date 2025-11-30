/**
 * Script to sync race data to Firestore
 * Usage: npx tsx scripts/race-data/sync-races.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { BaseRaceAdapter } from "./base-adapter";
import { INITIAL_US_RACES } from "./initial-races";
import type { RawRaceData, SyncResult } from "./types";
import type { RaceItem } from "@/lib/types";

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  // In production, use service account credentials
  // For now, we'll use the default credentials from environment
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

/**
 * Initial data adapter - uses the curated race list
 */
class InitialDataAdapter extends BaseRaceAdapter {
  name = "initial-dataset";
  sourceUrl = "internal";

  async fetchRaces(): Promise<RawRaceData[]> {
    return INITIAL_US_RACES;
  }
}

/**
 * Sync races from a data source to Firestore
 */
async function syncRacesFromSource(
  adapter: BaseRaceAdapter
): Promise<SyncResult> {
  const result: SyncResult = {
    source: adapter.name,
    timestamp: new Date(),
    racesAdded: 0,
    racesUpdated: 0,
    racesSkipped: 0,
    errors: [],
  };

  try {
    console.log(`\n🏊 Fetching races from ${adapter.name}...`);
    const rawRaces = await adapter.fetchRaces();
    console.log(`✅ Found ${rawRaces.length} races\n`);

    for (const rawRace of rawRaces) {
      try {
        const raceId = adapter['generateRaceId'](
          rawRace.name,
          rawRace.state,
          rawRace.distance
        );

        // Check if race already exists
        const raceRef = db.collection("races").doc(raceId);
        const existingRace = await raceRef.get();

        if (existingRace.exists) {
          const existingData = existingRace.data() as RaceItem;

          // Check if we should update
          if (adapter.shouldUpdate(existingData.lastScraped)) {
            // Update the race
            const updatedData = adapter.transformToRaceItem(rawRace);
            await raceRef.update({
              ...updatedData,
              updatedAt: new Date(),
            });

            result.racesUpdated++;
            console.log(`🔄 Updated: ${rawRace.name}`);
          } else {
            result.racesSkipped++;
            console.log(`⏭️  Skipped: ${rawRace.name} (recently updated)`);
          }
        } else {
          // Create new race
          const newRaceData = adapter.transformToRaceItem(rawRace);
          await raceRef.set({
            ...newRaceData,
            raceId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          result.racesAdded++;
          console.log(`✨ Added: ${rawRace.name}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push({
          raceId: rawRace.externalId,
          message: errorMsg,
        });
        console.error(`❌ Error processing ${rawRace.name}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push({
      message: `Failed to fetch races: ${errorMsg}`,
    });
    console.error(`❌ Failed to fetch races from ${adapter.name}: ${errorMsg}`);
  }

  return result;
}

/**
 * Main sync function
 */
export async function syncAllRaces() {
  console.log("🚀 Starting race data sync...\n");

  const adapters = [
    new InitialDataAdapter(),
    // Add more adapters here in the future:
    // new IronmanAdapter(),
    // new USATriathlonAdapter(),
  ];

  const results: SyncResult[] = [];

  for (const adapter of adapters) {
    const result = await syncRacesFromSource(adapter);
    results.push(result);
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SYNC SUMMARY");
  console.log("=".repeat(50) + "\n");

  for (const result of results) {
    console.log(`Source: ${result.source}`);
    console.log(`  ✅ Added: ${result.racesAdded}`);
    console.log(`  🔄 Updated: ${result.racesUpdated}`);
    console.log(`  ⏭️  Skipped: ${result.racesSkipped}`);
    console.log(`  ❌ Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n  Error details:");
      result.errors.forEach((err) => {
        console.log(`    - ${err.raceId || "Unknown"}: ${err.message}`);
      });
    }
    console.log("");
  }

  const totalAdded = results.reduce((sum, r) => sum + r.racesAdded, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.racesUpdated, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log("=".repeat(50));
  console.log(`Total races added: ${totalAdded}`);
  console.log(`Total races updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log("=".repeat(50) + "\n");

  console.log("✅ Race sync complete!");

  return results;
}

// Run the sync when executed directly
if (require.main === module) {
  syncAllRaces()
    .then(() => {
      console.log("\n👋 Exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Fatal error:", error);
      process.exit(1);
    });
}
