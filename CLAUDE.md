# CLAUDE.md - AI Assistant Guide for Endurank

This document provides comprehensive guidance for AI assistants working with the Endurank codebase. It explains architecture, patterns, conventions, and how to accomplish common tasks.

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Core Concepts](#core-concepts)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Key Components & Patterns](#key-components--patterns)
7. [Data Integrity System](#data-integrity-system)
8. [Common Tasks](#common-tasks)
9. [Important Conventions](#important-conventions)
10. [Gotchas & Considerations](#gotchas--considerations)

---

## Overview

**Endurank** is a personalized review platform for endurance sports gear (bikes, running shoes, nutrition) and races. The core innovation is the **Endurank algorithm**, which provides personalized product scores based on user preferences (cost sensitivity, skill level, race distance).

**Key Features:**
- Personalized recommendation algorithm (Endurank)
- Tiered review system (Beginner 0.75x, Contributor 1.0x, Expert 1.25x weights)
- Three-step data validation to prevent duplicates
- Moderation workflow for user-submitted content
- Firebase Authentication and Firestore backend
- Modern UI with shadcn/ui components

---

## Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3.4 (NOT v4 - compatibility issues)
- **Components**: shadcn/ui component library
- **Icons**: Lucide React
- **State Management**: React hooks + Context API (`AuthContext`)

### Backend
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (email/password)
- **Hosting**: Vercel (assumed)

### Key Libraries
- `firebase` v11.1.0 - Firebase SDK
- `next` v16 - React framework
- `tailwindcss` v3.4 - Utility-first CSS
- `lucide-react` - Icon library

### Architecture Pattern
- **Client-side rendering** with Next.js App Router
- **Context-based auth** via `lib/auth-context.tsx`
- **Direct Firestore queries** from components (no API routes yet)
- **Type-safe** with comprehensive TypeScript definitions in `lib/types.ts`

---

## Core Concepts

### 1. Endurank Algorithm

The **Endurank** score is a personalized recommendation metric calculated using:

```typescript
Endurank = (W_R × R_weighted) + (W_P × (1 - C) × R_weighted) - (W_C × C × P_norm)
```

**Variables:**
- `R_weighted`: Weighted average rating (weighted by reviewer tier)
- `C`: User's cost sensitivity (0-1)
  - `economy` = 1.0 (very cost-sensitive)
  - `mid-range` = 0.5 (balanced)
  - `performance` = 0.0 (not cost-sensitive)
- `P_norm`: Normalized price (0-1, relative to category max price)
- `W_R = 0.6`: Weight for rating
- `W_P = 0.3`: Weight for value
- `W_C = 0.1`: Weight for cost penalty

**Output:** Score from 0-10 (scaled from 0-5 base range)

**Implementation:** `lib/endurank.ts`

### 2. Tiered Review System

Reviews are weighted based on the reviewer's tier (determined by total review count):

| Tier | Review Count | Weight |
|------|-------------|--------|
| Beginner | 0-3 | 0.75 |
| Contributor | 4-10 | 1.0 |
| Expert | 11+ | 1.25 |

**Why it matters:** Expert reviews have more impact on the weighted average rating.

**Tier calculation:** See `TIER_THRESHOLDS` in `lib/types.ts`

### 3. Item Status Workflow

All user-submitted items go through a moderation workflow:

```
User submits → "pending" → Moderator reviews → "live" or "rejected"
```

- **pending**: Newly submitted, not visible on public pages
- **live**: Approved, visible to all users
- **rejected**: Denied by moderator, hidden from public

**Public views filter:** All browse/search/listing pages query `where("status", "==", "live")`

---

## Project Structure

```
trireview/
├── app/                           # Next.js App Router pages
│   ├── page.tsx                   # Home page with search bar
│   ├── auth/page.tsx              # Sign in/Sign up
│   ├── onboarding/page.tsx        # 3-step user preference survey
│   ├── browse/page.tsx            # Main browse page with filters/sorting
│   ├── search/page.tsx            # Search results page
│   ├── gear/
│   │   ├── page.tsx               # Gear listing page
│   │   └── [id]/page.tsx          # Gear detail page (PDP)
│   ├── races/
│   │   ├── page.tsx               # Race listing page
│   │   └── [id]/page.tsx          # Race detail page (PDP)
│   ├── wishlist/page.tsx          # User's saved items
│   └── admin/
│       ├── page.tsx               # Add new gear/race (all users)
│       └── moderate/page.tsx      # Moderation panel (approve/reject)
│
├── components/
│   ├── ui/                        # shadcn/ui components (Button, Card, etc.)
│   ├── auth/
│   │   └── auth-form.tsx          # Sign in/up form
│   ├── layout/
│   │   └── navbar.tsx             # Main navigation bar
│   ├── onboarding/
│   │   ├── skill-level-step.tsx
│   │   ├── distance-step.tsx
│   │   └── budget-step.tsx
│   ├── products/
│   │   ├── gear-card.tsx          # Gear item card with Endurank
│   │   ├── race-card.tsx          # Race item card with Endurank
│   │   └── filter-sort-bar.tsx   # Reusable filter/sort component
│   └── reviews/
│       ├── review-form.tsx        # Submit review form
│       └── review-list.tsx        # Display reviews
│
├── lib/
│   ├── firebase.ts                # Firebase initialization
│   ├── auth-context.tsx           # Auth context provider
│   ├── types.ts                   # TypeScript type definitions
│   ├── endurank.ts                # Endurank calculation logic
│   ├── db-utils.ts                # Firestore helper functions
│   ├── utils.ts                   # General utilities (cn, etc.)
│   ├── constants/
│   │   └── brands.ts              # Controlled brand lists
│   ├── utils/
│   │   └── fuzzy-match.ts         # Levenshtein distance algorithm
│   └── validation/
│       └── item-validation.ts     # 3-step validation system
│
├── scripts/
│   └── seed-data.ts               # Sample data seeding script
│
├── public/
│   ├── endurank-landing.png       # Home page background image
│   └── ...                        # Other static assets
│
└── package.json                   # Dependencies
```

---

## Database Schema

### Firestore Collections

#### 1. `users` Collection

**Document ID:** Firebase Auth UID

```typescript
{
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName?: string;
  reviewCount: number;            // Total reviews submitted
  tier: "beginner" | "contributor" | "expert";
  costSensitivity: "economy" | "mid-range" | "performance";
  preferredDistance: "sprint" | "olympic" | "half" | "full";
  skillLevel: "beginner" | "intermediate" | "advanced";
  wishlist: string[];             // Array of product/race IDs
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. `gear` Collection

**Document ID:** Auto-generated product ID (e.g., `cervelo-p-series`)

```typescript
{
  productId: string;              // Same as document ID
  productName: string;
  brand: string;                  // MUST be from controlled list
  subCategory: "bikes" | "running-shoes" | "nutrition";
  msrp: number;
  mpn?: string;                   // Manufacturer Part Number (unique)
  averageRating: number;          // Weighted average (0-5)
  totalReviewsCount: number;
  specs: {                        // Flexible JSON object
    frameType?: string;
    groupset?: string;
    weight?: string;
    // ... varies by subCategory
  };
  imageUrl?: string;
  status: "pending" | "live" | "rejected";
  createdBy?: string;             // User ID who submitted
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes needed:**
- `status` (for filtering live items)
- `brand` + `subCategory` (for fuzzy matching)
- `mpn` (for exact match validation)

#### 3. `races` Collection

**Document ID:** Auto-generated race ID (e.g., `ironman-california`)

```typescript
{
  raceId: string;
  raceName: string;
  raceDate: Date;
  location: {
    city: string;
    state: string;
  };
  distance: "sprint" | "olympic" | "half" | "full";
  msrp: number;                   // Registration cost
  avgCourseRating: number;        // 0-5
  avgCostRating: number;          // 0-5
  avgVolunteersRating: number;    // 0-5
  avgSpectatorRating: number;     // 0-5
  averageRating: number;          // Overall weighted average
  totalReviewsCount: number;
  imageUrl?: string;
  status: "pending" | "live" | "rejected";
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes needed:**
- `status` (for filtering live items)
- `raceName` + `distance` (for exact match validation)

#### 4. `reviews` Collection

**Document ID:** Auto-generated

```typescript
{
  reviewId: string;
  itemId: string;                 // References gear productId or race raceId
  itemType: "gear" | "race";
  userId: string;
  userTier: "beginner" | "contributor" | "expert"; // Cached at submission
  rating: number;                 // 1-5 stars
  title: string;
  text: string;
  raceSubRatings?: {              // Only for race reviews
    course: number;
    cost: number;
    volunteers: number;
    spectators: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Key Components & Patterns

### Authentication Flow

1. **AuthContext** (`lib/auth-context.tsx`):
   - Provides `user`, `loading`, `login`, `signup`, `logout`
   - Listens to Firebase auth state changes
   - Syncs Firestore user document with auth state

2. **Protected Routes**:
   - Components check `user` from `useAuth()`
   - Redirect to `/auth` if not authenticated
   - Example: `/wishlist`, `/admin`, `/admin/moderate`

### Endurank Display Pattern

**In any card/detail component:**

```typescript
import { calculateEndurank, getCostSensitivityFactor, calculateNormalizedPrice } from "@/lib/endurank";

// 1. Get user's cost sensitivity
const userCostSensitivity = user
  ? getCostSensitivityFactor(user.costSensitivity)
  : 0.5;

// 2. Calculate normalized price (within category)
const normalizedPrice = calculateNormalizedPrice(item.msrp, categoryMaxPrice);

// 3. Calculate Endurank
const endurank = calculateEndurank({
  averageRating: item.averageRating,
  costSensitivity: userCostSensitivity,
  normalizedPrice,
});

// 4. Display with color coding
const getEndurankColor = (score: number) => {
  if (score >= 8.5) return "text-green-600";
  if (score >= 7.0) return "text-blue-600";
  if (score >= 5.5) return "text-yellow-600";
  return "text-gray-600";
};
```

### Price Tier Display

Use `$`, `$$`, or `$$$` icons based on price ranges:

```typescript
const getPriceTier = (price: number, category: string) => {
  // Define thresholds per category
  if (category === "bikes") {
    if (price < 3000) return "budget";
    if (price < 5000) return "mid";
    return "premium";
  }
  // ... similar for other categories
};

const getPriceTierDisplay = (tier: string) => {
  return tier === "premium" ? "$$$" : tier === "mid" ? "$$" : "$";
};
```

### Firestore Query Pattern

**Always filter for live items in public views:**

```typescript
const gearRef = collection(db, "gear");
const gearQuery = query(
  gearRef,
  where("status", "==", "live"),
  orderBy("averageRating", "desc")
);
const snapshot = await getDocs(gearQuery);
```

---

## Data Integrity System

Endurank implements a **three-step validation system** to prevent duplicate items and ensure data quality.

### Step 1: Controlled Brand Selection

**Goal:** Prevent brand name variations (e.g., "Nike" vs "NIKE" vs "nike")

**Implementation:**
- Dropdown-only brand selection (no free-form text input)
- Curated brand lists in `lib/constants/brands.ts`
- Dynamic brand list based on selected category

```typescript
// lib/constants/brands.ts
export const BIKE_BRANDS = ["Cervélo", "Canyon", "Specialized", ...];
export const RUNNING_SHOE_BRANDS = ["Nike", "ASICS", "Hoka", ...];
export const NUTRITION_BRANDS = ["Maurten", "GU", "Skratch Labs", ...];

export function getBrandsForCategory(category: string): string[] {
  // Returns appropriate brand list
}
```

### Step 2: Exact Match Blocking

**Goal:** Block identical items from being re-submitted

**For Gear:**
1. Check MPN/SKU (if provided) → **BLOCK if exists**
2. Check Brand + ProductName + MSRP → **BLOCK if exists**

**For Races:**
- Check RaceName + Distance + Location (city + state) → **BLOCK if exists**

**Implementation:** `lib/validation/item-validation.ts`

```typescript
// Returns { isValid: false, error: "...", duplicateItem: {...} }
const result = await checkExactGearMatch(brand, productName, msrp, mpn);
```

### Step 3: Fuzzy Match Warning

**Goal:** Warn users about similar items (may be different variants/years)

**Algorithm:** Levenshtein distance with 85% similarity threshold

**Implementation:** `lib/utils/fuzzy-match.ts`

```typescript
// Returns list of similar items (WARNING, not blocking)
const result = await checkSimilarGear(brand, productName, subCategory);
if (result.similarItems?.length > 0) {
  // Show warning to user with links to similar items
}
```

**User Experience:**
- Exact match → **RED error, cannot proceed**
- Fuzzy match → **YELLOW warning, can proceed with confirmation**

### Validation Flow in Admin Form

See `app/admin/page.tsx` for full implementation:

1. User fills form
2. On submit, run exact match validation
3. If exact match found, show error + link to existing item
4. If no exact match, run fuzzy match
5. If fuzzy matches found, show warning + confirmation
6. User can proceed or cancel
7. Item submitted with `status: "pending"`
8. Moderator reviews at `/admin/moderate`

---

## Common Tasks

### Adding a New Product Category

1. **Update types** in `lib/types.ts`:
   ```typescript
   export type GearSubCategory = "bikes" | "running-shoes" | "nutrition" | "wetsuits";
   ```

2. **Add brand list** in `lib/constants/brands.ts`:
   ```typescript
   export const WETSUIT_BRANDS = ["Orca", "Roka", ...];
   ```

3. **Update category filter** in `components/products/filter-sort-bar.tsx`

4. **Add price tier logic** (if needed) in utility functions

### Running the Seed Script

Populate Firestore with sample data:

```bash
npx tsx scripts/seed-data.ts
```

**Note:** All seeded items have `status: "live"` (pre-approved)

### Adding a New Review

1. Create review document in `reviews` collection
2. Update `averageRating` and `totalReviewsCount` on the item
3. Update user's `reviewCount` (to recalculate tier)
4. Use transaction for atomicity:

```typescript
const reviewRef = doc(collection(db, "reviews"));
const itemRef = doc(db, "gear", itemId);
const userRef = doc(db, "users", userId);

await runTransaction(db, async (transaction) => {
  // Create review
  transaction.set(reviewRef, reviewData);

  // Update item averageRating & totalReviewsCount
  transaction.update(itemRef, {
    averageRating: newAverage,
    totalReviewsCount: increment(1)
  });

  // Update user reviewCount
  transaction.update(userRef, {
    reviewCount: increment(1)
  });
});
```

### Moderating Pending Items

1. Navigate to `/admin/moderate`
2. View pending gear/races in tabs
3. Click "Approve" → updates `status: "live"`
4. Click "Reject" → updates `status: "rejected"`

**Implementation:** `app/admin/moderate/page.tsx`

### Deploying to Production

1. Set up Vercel project
2. Add Firebase environment variables in Vercel dashboard
3. Update Firestore security rules (currently in development mode)
4. Deploy: `vercel --prod`

---

## Important Conventions

### File Naming
- **Components:** PascalCase (e.g., `GearCard.tsx`) - but currently using kebab-case
- **Pages:** lowercase (Next.js convention, e.g., `page.tsx`)
- **Utilities:** camelCase (e.g., `endurank.ts`)

### TypeScript
- **Always use types** from `lib/types.ts`
- **Avoid `any`** - use proper interfaces
- **Date handling:** Firestore Timestamps need `.toDate()` conversion

### Firestore
- **Document IDs:** Use kebab-case (e.g., `cervelo-p-series`)
- **Collection names:** Plural (e.g., `gear`, `races`, `reviews`, `users`)
- **Always include** `createdAt` and `updatedAt` timestamps

### UI Components
- Use **shadcn/ui** components from `components/ui/`
- Use **Lucide icons** (not other icon libraries)
- Follow **Tailwind** utility-first approach
- **Responsive:** Use `md:` and `lg:` breakpoints

### Color Coding
- **Endurank scores:** Green (>8.5), Blue (7-8.5), Yellow (5.5-7), Gray (<5.5)
- **Price tiers:** Budget ($), Mid ($$), Premium ($$$)
- **Status badges:** Beginner (bronze), Contributor (silver), Expert (gold)

---

## Gotchas & Considerations

### 1. Tailwind CSS Version

**DO NOT upgrade to Tailwind v4** - it has breaking changes with shadcn/ui.

```json
// package.json
"tailwindcss": "^3.4.0"  // ← Keep at 3.x
```

### 2. Firebase Timestamp Conversion

Firestore returns `Timestamp` objects, not `Date` objects:

```typescript
// ❌ WRONG
const item = doc.data();
console.log(item.createdAt); // Timestamp object

// ✅ CORRECT
const item = {
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date(),
};
```

### 3. Firestore Query Limitations

- **No full-text search** - consider adding Algolia/Typesense for production
- **Composite queries** limited - can't query nested fields directly
- **OR queries** not supported - need multiple queries + merge

### 4. Auth Context Loading State

Always check `loading` before checking `user`:

```typescript
const { user, loading } = useAuth();

if (loading) {
  return <Loader />;
}

if (!user) {
  return <SignInPrompt />;
}
```

### 5. Category Max Price Calculation

For Endurank to work, you need the **max price in the category**:

```typescript
const categoryMaxPrice = gearItems.length > 0
  ? Math.max(...gearItems.map(item => item.msrp))
  : 1;
```

**Why:** `P_norm` requires normalization against category max

### 6. Review Weight Caching

Reviews cache the user's tier at submission time:

```typescript
// When creating review
{
  userTier: user.tier, // Cache current tier
  // ...
}
```

**Why:** If user's tier changes later, old reviews keep their original weight

### 7. Search Query Encoding

Always encode search queries in URLs:

```typescript
router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
```

### 8. Background Images

Background images go in `/public` folder:

```typescript
// ✅ CORRECT
backgroundImage: "url('/endurank-landing.png')"

// ❌ WRONG
backgroundImage: "url('./endurank-landing.png')"
```

### 9. MPN/SKU is Optional

Not all gear has MPN/SKU - validation falls back to composite key:

```typescript
// If MPN exists, it's the primary unique identifier
// Otherwise, use Brand + ProductName + MSRP
```

### 10. Race Reviews Have 4 Sub-Ratings

Race reviews must collect 4 sub-ratings:

```typescript
{
  course: number;      // 0-5
  cost: number;        // 0-5
  volunteers: number;  // 0-5
  spectators: number;  // 0-5
}
```

**Overall rating** is calculated from these 4 values.

---

## Development Workflow

### Running Locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Seeding Data

```bash
npx tsx scripts/seed-data.ts
```

### Building for Production

```bash
npm run build
npm run start
```

### Key Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## Quick Reference

### File Locations

| What | Where |
|------|-------|
| Types | `lib/types.ts` |
| Endurank logic | `lib/endurank.ts` |
| Auth context | `lib/auth-context.tsx` |
| Firebase config | `lib/firebase.ts` |
| Brand lists | `lib/constants/brands.ts` |
| Validation | `lib/validation/item-validation.ts` |
| Fuzzy matching | `lib/utils/fuzzy-match.ts` |
| Seed script | `scripts/seed-data.ts` |
| Home page | `app/page.tsx` |
| Browse page | `app/browse/page.tsx` |
| Admin forms | `app/admin/page.tsx` |
| Moderation | `app/admin/moderate/page.tsx` |

### Key Functions

```typescript
// Calculate Endurank
import { calculateEndurank, getCostSensitivityFactor, calculateNormalizedPrice } from "@/lib/endurank";

// Validate items
import { checkExactGearMatch, checkSimilarGear } from "@/lib/validation/item-validation";

// Auth
import { useAuth } from "@/lib/auth-context";

// Firestore
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
```

---

## Future Enhancements

**Planned features (not yet implemented):**
- Image upload functionality
- Full-text search (Algolia/Typesense integration)
- Social features (follow users, upvote reviews)
- Imported reviews from web scraping
- Mobile app (iOS/Android)
- Additional categories (wetsuits, goggles, etc.)
- Advanced filtering (by brand, specs, etc.)
- Pagination for large result sets
- Review editing/deletion
- User profiles and reputation system

---

## Contact & Contributing

This is a personal project by Matt Celani. For questions or suggestions, see the GitHub repository.

**License:** MIT
