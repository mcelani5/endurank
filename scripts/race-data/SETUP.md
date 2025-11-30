# Race Data Collection Setup Guide

This guide walks through setting up the race data collection and sync system.

## Prerequisites

- Firebase project with Firestore enabled
- Vercel account (for scheduled cron jobs)
- Node.js 18+ installed locally

## Step 1: Environment Variables

Add these to your `.env.local` and Vercel environment variables:

```bash
# Firebase (already configured)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# ... other Firebase vars

# NEW: Cron job security
CRON_SECRET=your-random-secret-string

# NEW: Firebase Admin (for server-side operations)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Step 2: Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save it as `service-account.json` in the project root
5. Add to `.gitignore`:

```
# .gitignore
service-account.json
```

For Vercel deployment:
- Convert the JSON to a single-line string
- Add as `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- Update the initialization code to parse the JSON string

## Step 3: Initial Data Population

Run the sync script locally to populate the initial 50 races:

```bash
npx tsx scripts/race-data/sync-races.ts
```

You should see output like:

```
🚀 Starting race data sync...

🏊 Fetching races from initial-dataset...
✅ Found 50 races

✨ Added: IRONMAN Coeur d'Alene
✨ Added: IRONMAN Florida
...

📊 SYNC SUMMARY
==================================================
Source: initial-dataset
  ✅ Added: 50
  🔄 Updated: 0
  ⏭️  Skipped: 0
  ❌ Errors: 0

==================================================
Total races added: 50
Total races updated: 0
Total errors: 0
==================================================

✅ Race sync complete!
```

## Step 4: Verify in Firestore

1. Open Firebase Console → Firestore Database
2. Check the `races` collection
3. You should see 50 race documents
4. Each should have fields like:
   - `raceName`
   - `location` (with city, state, country, region)
   - `course` (with swim/bike/run distances)
   - `dataSource: "initial-dataset"`
   - `status: "live"`

## Step 5: Configure Vercel Cron Job

The `vercel.json` file is already configured to run the sync weekly:

```json
{
  "crons": [{
    "path": "/api/cron/sync-races",
    "schedule": "0 2 * * 0"
  }]
}
```

This runs every Sunday at 2:00 AM UTC.

### Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `CRON_SECRET` - Generate a random string
   - `NEXT_PUBLIC_FIREBASE_*` - Your Firebase config
   - `FIREBASE_SERVICE_ACCOUNT_KEY` - Service account JSON (single line)
4. Deploy

### Test the Cron Job

Test manually using curl:

```bash
curl -X POST https://your-app.vercel.app/api/cron/sync-races \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get a JSON response with sync results.

## Step 6: Monitor Sync Jobs

Check Vercel deployment logs to monitor weekly syncs:

1. Go to Vercel dashboard
2. Click on your project
3. Go to "Logs" tab
4. Filter by `/api/cron/sync-races`

Look for:
- Successful syncs (200 status)
- Number of races added/updated
- Any errors

## Step 7: Add More Data Sources (Future)

When ready to add live scraping:

### Create IRONMAN Adapter

```typescript
// scripts/race-data/ironman-adapter.ts
import { BaseRaceAdapter } from "./base-adapter";
import type { RawRaceData } from "./types";

export class IronmanAdapter extends BaseRaceAdapter {
  name = "ironman.com";
  sourceUrl = "https://www.ironman.com/races";

  async fetchRaces(): Promise<RawRaceData[]> {
    // TODO: Implement scraping/API logic
    // Options:
    // 1. Use IRONMAN's public API if available
    // 2. Web scraping with Puppeteer
    // 3. RSS feed parsing
    const races: RawRaceData[] = [];
    return races;
  }
}
```

### Add to Sync Script

```typescript
// scripts/race-data/sync-races.ts
import { IronmanAdapter } from "./ironman-adapter";

const adapters = [
  new InitialDataAdapter(),
  new IronmanAdapter(),  // ← Add here
];
```

## Troubleshooting

### Error: "Firebase Admin not initialized"

**Solution**: Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to valid service account JSON.

### Error: "Unauthorized" when testing cron

**Solution**: Verify `Authorization` header matches `CRON_SECRET` env var.

### Races not appearing in app

**Solution**: Check that `status` field is set to `"live"` and app queries are correct.

### Duplicate races

**Solution**: The `generateRaceId()` function creates consistent IDs. If you get duplicates:
- Check the ID generation logic
- Verify external IDs are unique

### Sync takes too long

**Solution**:
- Add batch processing (Firestore supports 500 ops/batch)
- Use `Promise.all()` for parallel updates
- Add rate limiting if hitting API limits

## Best Practices

1. **Test locally first**: Always run sync script locally before deploying
2. **Monitor logs**: Check Vercel logs weekly to catch issues
3. **Backup data**: Export Firestore data before major changes
4. **Rate limiting**: Be respectful when scraping external sites
5. **Error handling**: Log errors but don't fail entire sync for one race
6. **Idempotency**: Sync can run multiple times without duplicating data

## Future Enhancements

- [ ] Dashboard to view sync history and stats
- [ ] Email notifications on sync failures
- [ ] Admin UI to manually trigger syncs
- [ ] Race change detection (notify users when races update)
- [ ] Historical data tracking (price changes over time)
- [ ] Image scraping and upload to Firebase Storage
- [ ] Integration with more race series (Challenge, Rev3, local events)
- [ ] International race support (Canada, UK, Australia, etc.)

## Support

For issues or questions, see the main `README.md` in `/scripts/race-data/`.
