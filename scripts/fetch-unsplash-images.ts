/**
 * Fetch triathlon images from Unsplash and update race records
 * Usage: npx tsx scripts/fetch-unsplash-images.ts
 *
 * You'll need a free Unsplash API key from: https://unsplash.com/developers
 * Add to .env.local: UNSPLASH_ACCESS_KEY=your_key_here
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error('❌ UNSPLASH_ACCESS_KEY not found in .env.local');
  console.log('\n📋 To get an Unsplash API key:');
  console.log('1. Go to https://unsplash.com/developers');
  console.log('2. Create a free account');
  console.log('3. Create a new application');
  console.log('4. Copy your Access Key');
  console.log('5. Add to .env.local: UNSPLASH_ACCESS_KEY=your_key_here\n');
  process.exit(1);
}

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

// Curated search queries for different race types
const SEARCH_QUERIES: Record<string, string[]> = {
  sprint: [
    'triathlon sprint swimming',
    'triathlon transition area',
    'sprint triathlon runners',
  ],
  olympic: [
    'olympic triathlon cycling',
    'triathlon swimming start',
    'triathlon athletes running',
  ],
  half: [
    'ironman 70.3 cycling',
    'half ironman swimming',
    'triathlon finish line celebration',
  ],
  full: [
    'ironman triathlon swim start',
    'ironman cycling mountains',
    'ironman finish line night',
  ],
};

// Special location-based queries
const LOCATION_QUERIES: Record<string, string> = {
  'Lake Placid': 'triathlon mountain lake',
  'Boulder': 'triathlon mountain bike',
  'Chattanooga': 'triathlon river swimming',
  'Oceanside': 'triathlon ocean beach',
  'Santa Rosa': 'triathlon wine country',
  'San Francisco': 'triathlon bay bridge',
  'Miami': 'triathlon tropical beach',
  'Arizona': 'triathlon desert',
  'Florida': 'triathlon beach palm trees',
  'Colorado': 'triathlon mountains',
};

async function searchUnsplash(query: string, perPage: number = 1): Promise<any> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results[0]; // Return first result
}

function getSearchQuery(race: any): string {
  const { raceName, location, distance, course } = race;

  // Check for location-specific query
  for (const [locationKey, query] of Object.entries(LOCATION_QUERIES)) {
    if (raceName.includes(locationKey) || location.city?.includes(locationKey)) {
      return query;
    }
  }

  // Use distance-based queries
  const queries = SEARCH_QUERIES[distance] || SEARCH_QUERIES.olympic;

  // Add terrain-specific modifier
  if (course?.waterType === 'ocean') {
    return 'triathlon ocean swimming start';
  } else if (course?.terrain === 'mixed') {
    return 'triathlon mountain trail';
  }

  // Return random query from distance array
  return queries[Math.floor(Math.random() * queries.length)];
}

async function updateRaceImages() {
  console.log('🖼️  Fetching triathlon images from Unsplash...\n');

  try {
    // Fetch all races
    const racesSnapshot = await getDocs(collection(db, 'races'));
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const raceDoc of racesSnapshot.docs) {
      const race = raceDoc.data();

      try {
        // Skip if already has image
        if (race.imageUrl) {
          console.log(`⏭️  ${race.raceName} - Already has image`);
          skipped++;
          continue;
        }

        // Get search query
        const query = getSearchQuery(race);
        console.log(`🔍 ${race.raceName} - Searching: "${query}"`);

        // Search Unsplash
        const photo = await searchUnsplash(query);

        if (!photo) {
          console.log(`❌ ${race.raceName} - No image found`);
          errors++;
          continue;
        }

        // Update race with image URL (regular quality for web)
        const imageUrl = photo.urls.regular;
        const photographer = photo.user.name;
        const photographerUrl = photo.user.links.html;

        await updateDoc(doc(db, 'races', raceDoc.id), {
          imageUrl,
          imageCredit: {
            photographer,
            photographerUrl,
            source: 'Unsplash',
            sourceUrl: photo.links.html,
          },
          updatedAt: new Date(),
        });

        console.log(`✅ ${race.raceName} - Image added`);
        console.log(`   📸 Photo by ${photographer}`);
        console.log(`   🔗 ${imageUrl.substring(0, 60)}...`);
        updated++;

        // Rate limiting: Unsplash free tier allows 50 requests/hour
        // Add 1 second delay between requests to be safe
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ ${race.raceName} - Error: ${errorMsg}`);
        errors++;
      }

      console.log('');
    }

    console.log('=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped} (already had images)`);
    console.log(`❌ Errors: ${errors}`);
    console.log('=' .repeat(60));

    console.log('\n✅ Image update complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

updateRaceImages();
