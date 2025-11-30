# Firestore Indexes Required

When you first load the Races page, you might see an error in the console about a missing index. This is normal for Firestore composite queries.

## Required Index

**Collection:** `races`
**Fields:**
- `status` (Ascending)
- `raceDate` (Ascending)

## How to Create

### Option 1: Auto-create from Error Link
1. Load `/races` page in your deployed or local app
2. Open browser console
3. Look for Firestore error with a clickable link
4. Click the link to auto-create the index in Firebase Console
5. Wait 1-2 minutes for index to build

### Option 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Firestore Database → Indexes tab
3. Click "Create Index"
4. Collection: `races`
5. Add fields:
   - `status` → Ascending
   - `raceDate` → Ascending
6. Click "Create"

The index typically takes 1-2 minutes to build. Once complete, the Races page will load smoothly.

## Why This Index?

The Races page uses this query:
```typescript
query(
  racesRef,
  where("status", "==", "live"),
  orderBy("raceDate", "asc")
)
```

Firestore requires a composite index for queries that combine `where()` and `orderBy()` on different fields.
