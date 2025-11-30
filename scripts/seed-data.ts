/**
 * Sample data seeding script for Firestore
 * Run this once to populate the database with test data
 *
 * Usage: npx tsx scripts/seed-data.ts
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const sampleGear = [
  {
    productId: "cervelo-p-series",
    productName: "Cervélo P-Series Ultegra",
    brand: "Cervélo",
    subCategory: "bikes",
    msrp: 4500,
    averageRating: 4.7,
    totalReviewsCount: 23,
    specs: {
      frameType: "Carbon",
      groupset: "Shimano Ultegra",
      weight: "8.2 kg"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "hoka-clifton-9",
    productName: "Hoka Clifton 9",
    brand: "Hoka",
    subCategory: "running-shoes",
    msrp: 145,
    averageRating: 4.5,
    totalReviewsCount: 89,
    specs: {
      weight: "8.9 oz",
      drop: "5mm",
      cushioning: "Max"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "canyon-speedmax-cf8",
    productName: "Canyon Speedmax CF 8",
    brand: "Canyon",
    subCategory: "bikes",
    msrp: 3200,
    averageRating: 4.8,
    totalReviewsCount: 15,
    specs: {
      frameType: "Carbon",
      groupset: "Shimano 105",
      weight: "8.5 kg"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "nike-vaporfly",
    productName: "Nike ZoomX Vaporfly",
    brand: "Nike",
    subCategory: "running-shoes",
    msrp: 260,
    averageRating: 4.6,
    totalReviewsCount: 134,
    specs: {
      weight: "6.6 oz",
      drop: "8mm",
      cushioning: "High"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "specialized-shiv",
    productName: "Specialized Shiv Sport",
    brand: "Specialized",
    subCategory: "bikes",
    msrp: 5200,
    averageRating: 4.9,
    totalReviewsCount: 31,
    specs: {
      frameType: "Carbon",
      groupset: "Shimano Ultegra Di2",
      weight: "7.8 kg"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "asics-kayano-30",
    productName: "ASICS Gel-Kayano 30",
    brand: "ASICS",
    subCategory: "running-shoes",
    msrp: 160,
    averageRating: 4.4,
    totalReviewsCount: 78,
    specs: {
      weight: "10.9 oz",
      drop: "10mm",
      cushioning: "High"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "maurten-gel-100",
    productName: "Maurten Gel 100",
    brand: "Maurten",
    subCategory: "nutrition",
    msrp: 45,
    averageRating: 4.7,
    totalReviewsCount: 156,
    specs: {
      calories: "100",
      carbs: "25g",
      servingSize: "40g"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "gu-energy-gel",
    productName: "GU Energy Gel",
    brand: "GU",
    subCategory: "nutrition",
    msrp: 32,
    averageRating: 4.5,
    totalReviewsCount: 342,
    specs: {
      calories: "100",
      carbs: "22g",
      servingSize: "32g"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "skratch-hydration-mix",
    productName: "Skratch Labs Sport Hydration Mix",
    brand: "Skratch Labs",
    subCategory: "nutrition",
    msrp: 22,
    averageRating: 4.8,
    totalReviewsCount: 267,
    specs: {
      calories: "80",
      electrolytes: "380mg sodium",
      servingSize: "20 servings"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "science-in-sport-beta-fuel",
    productName: "Science in Sport Beta Fuel",
    brand: "SiS",
    subCategory: "nutrition",
    msrp: 38,
    averageRating: 4.6,
    totalReviewsCount: 98,
    specs: {
      calories: "160",
      carbs: "40g",
      servingSize: "60ml"
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const sampleRaces = [
  {
    raceId: "ironman-california",
    raceName: "IRONMAN California",
    raceDate: new Date("2025-05-10"),
    location: { city: "Sacramento", state: "CA" },
    distance: "full",
    msrp: 850,
    avgCourseRating: 4.5,
    avgCostRating: 3.8,
    avgVolunteersRating: 4.9,
    avgSpectatorRating: 4.7,
    averageRating: 4.5,
    totalReviewsCount: 67,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    raceId: "boulder-sunset-tri",
    raceName: "Boulder Sunset Triathlon",
    raceDate: new Date("2025-07-15"),
    location: { city: "Boulder", state: "CO" },
    distance: "olympic",
    msrp: 175,
    avgCourseRating: 4.8,
    avgCostRating: 4.2,
    avgVolunteersRating: 4.6,
    avgSpectatorRating: 4.4,
    averageRating: 4.6,
    totalReviewsCount: 142,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    raceId: "austin-sprint-tri",
    raceName: "Austin Sprint Tri",
    raceDate: new Date("2025-06-20"),
    location: { city: "Austin", state: "TX" },
    distance: "sprint",
    msrp: 95,
    avgCourseRating: 4.3,
    avgCostRating: 4.5,
    avgVolunteersRating: 4.7,
    avgSpectatorRating: 4.2,
    averageRating: 4.4,
    totalReviewsCount: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    raceId: "miami-half-ironman",
    raceName: "IRONMAN 70.3 Miami",
    raceDate: new Date("2025-04-05"),
    location: { city: "Miami", state: "FL" },
    distance: "half",
    msrp: 425,
    avgCourseRating: 4.6,
    avgCostRating: 3.9,
    avgVolunteersRating: 4.8,
    avgSpectatorRating: 4.5,
    averageRating: 4.5,
    totalReviewsCount: 112,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    raceId: "chicago-olympic-tri",
    raceName: "Chicago Triathlon",
    raceDate: new Date("2025-08-30"),
    location: { city: "Chicago", state: "IL" },
    distance: "olympic",
    msrp: 200,
    avgCourseRating: 4.7,
    avgCostRating: 4.1,
    avgVolunteersRating: 4.9,
    avgSpectatorRating: 4.8,
    averageRating: 4.6,
    totalReviewsCount: 203,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedData() {
  console.log("🌱 Starting database seed...");

  try {
    // Seed gear items
    console.log("\n📦 Seeding gear items...");
    for (const gear of sampleGear) {
      await setDoc(doc(db, "gear", gear.productId), {
        ...gear,
        status: "live", // Sample data is pre-approved
      });
      console.log(`  ✓ Added: ${gear.productName}`);
    }

    // Seed races
    console.log("\n🏁 Seeding races...");
    for (const race of sampleRaces) {
      await setDoc(doc(db, "races", race.raceId), {
        ...race,
        status: "live", // Sample data is pre-approved
      });
      console.log(`  ✓ Added: ${race.raceName}`);
    }

    console.log("\n✅ Database seeding completed successfully!");
    console.log(`\nAdded ${sampleGear.length} gear items (bikes, shoes, nutrition) and ${sampleRaces.length} races.`);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedData();
