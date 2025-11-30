# Firebase Setup Guide for Endurank

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "Endurank" (or your preferred name)
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the web icon `</>`
2. Register app with nickname "Endurank Web"
3. Don't check "Firebase Hosting" (we'll use Vercel or similar)
4. Copy the Firebase config object

## Step 3: Enable Authentication

1. In the Firebase Console, go to **Authentication**
2. Click "Get started"
3. Click on "Email/Password" under Sign-in method
4. Toggle "Enable"
5. Click "Save"

## Step 4: Create Firestore Database

1. In the Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **Test mode** (for development)
   - **Important**: This allows read/write access. Update security rules for production!
4. Choose a location (preferably closest to your users)
5. Click "Enable"

## Step 5: Create Firestore Collections

While your database will auto-create collections when data is added, you can manually create them:

### Collections to create:

1. **users**
   - Stores user profiles and preferences

2. **gear**
   - Stores triathlon gear items (bikes, shoes, etc.)

3. **races**
   - Stores triathlon race information

4. **reviews**
   - Stores user reviews for gear and races

5. **importedReviews** (optional for MVP)
   - Stores scraped/imported reviews from external sources

## Step 6: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Firebase config from Step 2:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=endurank-xxxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=endurank-xxxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=endurank-xxxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
   ```

## Step 7: Update Firestore Security Rules (Production)

For production, update your Firestore rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all user profiles but only update their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Anyone can read gear and races
    match /gear/{gearId} {
      allow read: if true;
      allow write: if false; // Only through admin panel
    }

    match /races/{raceId} {
      allow read: if true;
      allow write: if false; // Only through admin panel
    }

    // Authenticated users can read all reviews and write their own
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              request.auth.uid == resource.data.userId;
    }

    // Anyone can read imported reviews
    match /importedReviews/{reviewId} {
      allow read: if true;
      allow write: if false; // Only through admin/scraper
    }
  }
}
```

## Step 8: Add Sample Data (Optional)

To test the app, you can manually add some sample documents in Firestore Console:

### Sample Gear Item:
```json
{
  "productId": "bike-001",
  "productName": "Cervélo P-Series Ultegra",
  "brand": "Cervélo",
  "subCategory": "bikes",
  "msrp": 4500,
  "averageRating": 4.7,
  "totalReviewsCount": 23,
  "specs": {
    "frameMatrial": "Carbon",
    "groupset": "Shimano Ultegra",
    "weight": "8.2 kg"
  },
  "createdAt": "2024-11-19T00:00:00Z",
  "updatedAt": "2024-11-19T00:00:00Z"
}
```

### Sample Race:
```json
{
  "raceId": "race-001",
  "raceName": "IRONMAN California",
  "raceDate": "2025-05-10T00:00:00Z",
  "location": {
    "city": "Sacramento",
    "state": "CA"
  },
  "distance": "full",
  "msrp": 850,
  "avgCourseRating": 4.5,
  "avgCostRating": 3.8,
  "avgVolunteersRating": 4.9,
  "avgSpectatorRating": 4.7,
  "averageRating": 4.5,
  "totalReviewsCount": 67,
  "createdAt": "2024-11-19T00:00:00Z",
  "updatedAt": "2024-11-19T00:00:00Z"
}
```

## Step 9: Test Your Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Test the auth flow:
   - Go to `/auth`
   - Create a new account
   - Complete the onboarding flow
   - Verify user document is created in Firestore

4. Test adding data through admin panel:
   - Go to `/admin`
   - Add a test gear item or race
   - Verify it appears in Firestore

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure all environment variables are set correctly in `.env.local`
- Restart the dev server after adding env variables

### "Missing or insufficient permissions"
- Check your Firestore security rules
- For development, you can use test mode (public read/write)

### Auth not persisting after refresh
- This is expected during development with test mode
- Will work properly once security rules are configured

## Next Steps

Once Firebase is set up:
1. Implement the actual Firestore queries in place of mock data
2. Add Cloud Functions for complex operations (calculating weighted averages, etc.)
3. Set up Firebase Storage for product images
4. Configure production security rules
5. Set up Firebase Hosting or deploy to Vercel
