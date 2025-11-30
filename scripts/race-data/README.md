# Race Data Collection Framework

This directory contains scripts and adapters for collecting and syncing race data from external sources to Firestore.

## Overview

The race data collection system consists of:

1. **Data Sources**: Adapters that fetch race data from external sources (IRONMAN.com, USA Triathlon, etc.)
2. **Transformation**: Convert raw data into the standardized `RaceItem` format
3. **Sync Logic**: Smart updates that only modify races when needed
4. **Scheduling**: Weekly automated updates via cron job or serverless function

## Files

- `types.ts` - TypeScript interfaces for raw race data and adapters
- `base-adapter.ts` - Base class for data source adapters
- `initial-races.ts` - Curated dataset of 50 major US triathlon races
- `sync-races.ts` - Main sync script that populates Firestore
- `README.md` - This file

## Usage

### One-time Initial Seed

To populate the database with the initial 50 races:

```bash
npx tsx scripts/race-data/sync-races.ts
```

This will:
- Add all races from `initial-races.ts` to Firestore
- Set their status to "live" (auto-approved)
- Skip races that already exist and were recently updated

### Weekly Sync (Future)

The sync script is designed to be run weekly. It will:
- Check each race's `lastScraped` timestamp
- Only update races not updated in the last 7 days
- Add new races discovered from data sources
- Update existing races if information has changed

#### Option 1: Vercel Cron Job

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/sync-races",
    "schedule": "0 2 * * 0"
  }]
}
```

Then create `app/api/cron/sync-races/route.ts` to call the sync logic.

#### Option 2: GitHub Actions

Create `.github/workflows/sync-races.yml`:

```yaml
name: Sync Race Data
on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/race-data/sync-races.ts
        env:
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
```

## Data Schema

### RawRaceData

Intermediate format from external sources before transformation:

```typescript
{
  externalId: string;           // ID from source system
  name: string;
  date: Date;
  city: string;
  state: string;
  distance: "sprint" | "olympic" | "half" | "full";
  registrationCost?: number;
  // ... see types.ts for full schema
}
```

### RaceItem

Final Firestore document format (see `lib/types.ts`):

```typescript
{
  raceId: string;
  raceName: string;
  raceDate: Date;
  location: { city, state, country, region };
  distance: RaceDistance;
  msrp: number;
  course?: { swim, bike, run distances, elevation, terrain };
  organizerSeries?: string;
  dataSource?: string;
  lastScraped?: Date;
  // ... see lib/types.ts for full schema
}
```

## Adding New Data Sources

### Step 1: Create Adapter Class

Create a new file (e.g., `ironman-adapter.ts`):

```typescript
import { BaseRaceAdapter } from "./base-adapter";
import type { RawRaceData } from "./types";

export class IronmanAdapter extends BaseRaceAdapter {
  name = "ironman.com";
  sourceUrl = "https://www.ironman.com/races";

  async fetchRaces(): Promise<RawRaceData[]> {
    // Implement scraping logic
    // Use fetch, cheerio, puppeteer, or API calls
    const races: RawRaceData[] = [];

    // Example API call:
    const response = await fetch("https://api.ironman.com/v1/races");
    const data = await response.json();

    for (const race of data) {
      races.push({
        externalId: race.id,
        name: race.name,
        date: new Date(race.date),
        city: race.location.city,
        state: race.location.state,
        distance: this.mapDistance(race.distance),
        registrationCost: race.price,
        // ... map other fields
      });
    }

    return races;
  }

  private mapDistance(dist: string): "sprint" | "olympic" | "half" | "full" {
    // Map source distance format to our enum
    if (dist.includes("70.3")) return "half";
    if (dist.includes("IRONMAN")) return "full";
    // ... etc
    return "olympic";
  }
}
```

### Step 2: Add to Sync Script

In `sync-races.ts`:

```typescript
import { IronmanAdapter } from "./ironman-adapter";

const adapters = [
  new InitialDataAdapter(),
  new IronmanAdapter(),  // Add here
  // ... other adapters
];
```

### Step 3: Test

```bash
npx tsx scripts/race-data/sync-races.ts
```

## Best Practices

1. **Respect Rate Limits**: Add delays between requests if scraping
2. **Error Handling**: Catch and log errors for individual races
3. **Idempotency**: Sync script can be run multiple times safely
4. **Data Quality**: Validate data before saving to Firestore
5. **Monitoring**: Log sync results for debugging

## Future Enhancements

- [ ] Implement IRONMAN.com scraper/API adapter
- [ ] Implement USA Triathlon API adapter
- [ ] Add Challenge Family, Rev3, and other series
- [ ] International race support
- [ ] Race results scraping (for historical data)
- [ ] Email notifications on sync errors
- [ ] Dashboard to view sync history
- [ ] Webhook to notify app of new races

## Firestore Security

Remember to update Firestore security rules to allow the sync script to write:

```javascript
match /races/{raceId} {
  allow read: if true;
  allow write: if request.auth != null &&
    (request.auth.token.admin == true ||
     request.resource.data.dataSource != null);  // Allow synced data
}
```

## Troubleshooting

**Issue**: Script fails with Firebase auth error

**Solution**: Ensure Firebase Admin credentials are configured:
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Or use Application Default Credentials (ADC)

**Issue**: Races not updating

**Solution**: Check `lastScraped` timestamp and `shouldUpdate()` logic

**Issue**: Duplicate races

**Solution**: Verify `generateRaceId()` creates consistent IDs
