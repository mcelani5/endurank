/**
 * Simpler script to seed race data using client-side Firebase
 * Usage: npx tsx scripts/seed-races-client.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";
import dotenv from 'dotenv';
import { resolve } from 'path';
import { INITIAL_US_RACES } from "./race-data/initial-races";
import type { RaceItem } from "@/lib/types";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase with client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateRaceId(name: string, state: string, distance: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${normalized}-${state.toLowerCase()}-${distance}`;
}

function getRegion(state: string): string {
  const regions: Record<string, string> = {
    'CA': 'West Coast', 'OR': 'West Coast', 'WA': 'West Coast',
    'AZ': 'Southwest', 'NM': 'Southwest', 'NV': 'Southwest', 'UT': 'Southwest', 'CO': 'Southwest',
    'IL': 'Midwest', 'IN': 'Midwest', 'IA': 'Midwest', 'KS': 'Midwest', 'MI': 'Midwest',
    'MN': 'Midwest', 'MO': 'Midwest', 'NE': 'Midwest', 'ND': 'Midwest', 'OH': 'Midwest',
    'SD': 'Midwest', 'WI': 'Midwest',
    'AL': 'Southeast', 'AR': 'Southeast', 'FL': 'Southeast', 'GA': 'Southeast', 'KY': 'Southeast',
    'LA': 'Southeast', 'MS': 'Southeast', 'NC': 'Southeast', 'SC': 'Southeast', 'TN': 'Southeast',
    'VA': 'Southeast', 'WV': 'Southeast',
    'CT': 'Northeast', 'DE': 'Northeast', 'ME': 'Northeast', 'MD': 'Northeast', 'MA': 'Northeast',
    'NH': 'Northeast', 'NJ': 'Northeast', 'NY': 'Northeast', 'PA': 'Northeast', 'RI': 'Northeast',
    'VT': 'Northeast',
    'ID': 'Mountain West', 'MT': 'Mountain West', 'WY': 'Mountain West',
    'TX': 'Texas',
    'HI': 'Hawaii', 'AK': 'Alaska',
  };
  return regions[state] || 'Other';
}

async function seedRaces() {
  console.log('🚀 Starting race data seed...\n');

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const rawRace of INITIAL_US_RACES) {
    try {
      const raceId = generateRaceId(rawRace.name, rawRace.state, rawRace.distance);
      const raceRef = doc(db, "races", raceId);

      // Check if race already exists
      const racesSnapshot = await getDocs(collection(db, "races"));
      const exists = racesSnapshot.docs.some(doc => doc.id === raceId);

      if (exists) {
        console.log(`⏭️  Skipped: ${rawRace.name} (already exists)`);
        skipped++;
        continue;
      }

      const raceDate = typeof rawRace.date === 'string'
        ? new Date(rawRace.date)
        : rawRace.date;

      const raceData: any = {
        raceId,
        raceName: rawRace.name,
        raceDate,
        location: {
          city: rawRace.city,
          state: rawRace.state,
          country: rawRace.country || "USA",
          region: getRegion(rawRace.state),
        },
        distance: rawRace.distance,
        msrp: rawRace.registrationCost || 0,
        avgCourseRating: 0,
        avgCostRating: 0,
        avgVolunteersRating: 0,
        avgSpectatorRating: 0,
        averageRating: 0,
        totalReviewsCount: 0,
        dataSource: "initial-dataset",
        externalId: rawRace.externalId,
        lastScraped: new Date(),
        status: "live",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they have values
      if (rawRace.swimDistanceMeters || rawRace.bikeDistanceMeters || rawRace.runDistanceMeters ||
          rawRace.elevationGainMeters || rawRace.terrain || rawRace.waterType) {
        raceData.course = {};
        if (rawRace.swimDistanceMeters) raceData.course.swimDistance = rawRace.swimDistanceMeters;
        if (rawRace.bikeDistanceMeters) raceData.course.bikeDistance = rawRace.bikeDistanceMeters;
        if (rawRace.runDistanceMeters) raceData.course.runDistance = rawRace.runDistanceMeters;
        if (rawRace.elevationGainMeters) raceData.course.elevationGain = rawRace.elevationGainMeters;
        if (rawRace.terrain) raceData.course.terrain = rawRace.terrain;
        if (rawRace.waterType) raceData.course.waterType = rawRace.waterType;
      }

      if (rawRace.organizerSeries) raceData.organizerSeries = rawRace.organizerSeries;
      if (rawRace.registrationUrl) raceData.registrationUrl = rawRace.registrationUrl;
      if (rawRace.raceWebsiteUrl) raceData.raceWebsiteUrl = rawRace.raceWebsiteUrl;
      if (rawRace.registrationStatus) raceData.registrationStatus = rawRace.registrationStatus;
      if (rawRace.maxCapacity) raceData.maxCapacity = rawRace.maxCapacity;
      if (rawRace.isQualifier) raceData.isQualifier = rawRace.isQualifier;
      if (rawRace.qualifierFor) raceData.qualifierFor = rawRace.qualifierFor;

      await setDoc(raceRef, raceData);
      console.log(`✨ Added: ${rawRace.name}`);
      added++;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error processing ${rawRace.name}: ${errorMsg}`);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 SEED SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Added: ${added}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("=".repeat(50) + "\n");

  console.log("✅ Race seed complete!");
}

// Run the seed
seedRaces()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
