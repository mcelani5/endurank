/**
 * Generate image prompts for each race based on characteristics
 * Usage: npx tsx scripts/generate-race-image-prompts.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase
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

interface RacePrompt {
  raceId: string;
  raceName: string;
  location: { city: string; state: string };
  distance: string;
  prompt: string;
}

function generateImagePrompt(race: any): string {
  const { raceName, location, distance, course, organizerSeries } = race;

  let prompt = `Professional triathlon race photography, ${distance} distance triathlon`;

  // Add location context
  if (location.city && location.state) {
    // Add location-specific details
    const locationContext = getLocationContext(location.city, location.state);
    if (locationContext) {
      prompt += `, ${locationContext}`;
    } else {
      prompt += `, ${location.city}, ${location.state}`;
    }
  }

  // Add terrain/course details
  if (course?.terrain) {
    prompt += `, ${course.terrain} terrain`;
  }

  // Add water type
  if (course?.waterType) {
    prompt += `, ${course.waterType} swim`;
  }

  // Add organizer branding
  if (organizerSeries?.toLowerCase().includes('ironman')) {
    prompt += `, IRONMAN branded event`;
  }

  // Add race vibe based on distance
  switch (distance) {
    case 'sprint':
      prompt += `, fast-paced sprint race, energetic athletes, beginner-friendly atmosphere`;
      break;
    case 'olympic':
      prompt += `, competitive olympic distance, determined athletes, professional racing`;
      break;
    case 'half':
      prompt += `, IRONMAN 70.3, endurance athletes, challenging course, dramatic landscape`;
      break;
    case 'full':
      prompt += `, full IRONMAN distance, epic endurance challenge, iconic finish line, sunset finish`;
      break;
  }

  // General race atmosphere
  prompt += `, vibrant race atmosphere, spectators cheering, transition area, race banners, professional event photography, high quality, 8k resolution, dramatic lighting`;

  return prompt;
}

function getLocationContext(city: string, state: string): string | null {
  const contexts: Record<string, string> = {
    // Iconic locations
    'Lake Placid, NY': 'scenic Adirondack mountains, mirror lake, autumn foliage',
    'Boulder, CO': 'Rocky Mountain backdrop, Boulder Reservoir, high altitude training',
    'Chattanooga, TN': 'Tennessee River, Lookout Mountain backdrop, southern hospitality',
    'Oceanside, CA': 'Pacific Ocean coastline, California beaches, pier backdrop',
    'Santa Rosa, CA': 'wine country, rolling hills, Northern California scenery',
    'Coeur d\'Alene, ID': 'pristine lake waters, mountain scenery, pacific northwest beauty',
    'Cambridge, MD': 'Chesapeake Bay, historic waterfront, eastern shore charm',
    'Augusta, GA': 'Savannah River, southern landscape, historic downtown',
    'Gulf Coast, FL': 'white sand beaches, emerald waters, Florida coastline',
    'Tempe, AZ': 'Tempe Town Lake, desert landscape, Arizona sunshine',
    'Wisconsin, WI': 'Lake Monona, Madison capitol, midwest charm',
    'Texas, TX': 'Hill Country, lakes and rivers, Texas landscape',
    'Arizona, AZ': 'desert beauty, red rocks, southwestern scenery',
    'California, CA': 'golden state, diverse landscapes, Pacific coast',
    'Colorado, CO': 'mountain backdrop, high altitude, Rocky Mountains',
    'Florida, FL': 'tropical setting, palm trees, ocean views',
  };

  // Try city, state combo first
  const key = `${city}, ${state}`;
  if (contexts[key]) return contexts[key];

  // Try state only
  if (contexts[state]) return contexts[state];

  return null;
}

async function generatePrompts() {
  console.log('🎨 Generating image prompts for all races...\n');

  try {
    // Fetch all races
    const racesSnapshot = await getDocs(collection(db, 'races'));
    const prompts: RacePrompt[] = [];

    racesSnapshot.docs.forEach(doc => {
      const race = doc.data();
      const prompt = generateImagePrompt(race);

      prompts.push({
        raceId: doc.id,
        raceName: race.raceName,
        location: race.location,
        distance: race.distance,
        prompt,
      });

      console.log(`✅ ${race.raceName}`);
      console.log(`   📍 ${race.location.city}, ${race.location.state}`);
      console.log(`   🎨 Prompt: ${prompt.substring(0, 100)}...`);
      console.log('');
    });

    // Save prompts to JSON file
    const outputPath = resolve(process.cwd(), 'scripts/race-image-prompts.json');
    fs.writeFileSync(outputPath, JSON.stringify(prompts, null, 2));

    console.log(`\n✅ Generated ${prompts.length} image prompts`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📋 Next steps:');
    console.log('1. Use these prompts with DALL-E, Midjourney, or Stable Diffusion');
    console.log('2. Save generated images to /public/race-images/');
    console.log('3. Run update script to add image URLs to Firestore');

  } catch (error) {
    console.error('❌ Error generating prompts:', error);
    process.exit(1);
  }

  process.exit(0);
}

generatePrompts();
