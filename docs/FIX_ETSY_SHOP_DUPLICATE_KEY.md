# Fix for EtsyShop Duplicate Key Error

## Problem
When connecting an Etsy shop, you may encounter:
```
E11000 duplicate key error collection: test.etsyshops index: shopId_1 dup key: { shopId: "62107897" }
```

## Root Cause
The database had an old unique index on just `shopId` from the previous schema, which conflicts with the new multi-user schema that requires a compound unique index on `{userId: 1, shopId: 1}`.

## Solution

### Option 1: Run Migration Script (Recommended)
A migration script has been created to fix the indexes:

```bash
node scripts/fix-etsy-shop-indexes.js
```

This script:
1. Drops the old unique index on `shopId` (if it exists)
2. Ensures the compound unique index `{userId: 1, shopId: 1}` exists

### Option 2: Manual MongoDB Fix
If you prefer to fix it manually in MongoDB:

```javascript
// Connect to your MongoDB database
use test; // or your database name

// Drop the old unique index
db.etsyshops.dropIndex("shopId_1");

// Verify the compound index exists (Mongoose should create it, but verify)
db.etsyshops.getIndexes();
```

### Option 3: Code-Level Fix
The auth route has been updated to use `findOneAndUpdate` with upsert, which handles duplicate key errors more gracefully. However, you still need to fix the database indexes for this to work properly.

## Verification
After running the migration, verify the indexes:

```javascript
db.etsyshops.getIndexes();
```

You should see:
- `_id_` (default)
- `userId_1` (non-unique, for queries)
- `userId_1_shopId_1` (unique compound index)

You should NOT see:
- `shopId_1` (old unique index - should be removed)

## Result
After fixing the indexes:
- Multiple users can connect the same Etsy shop ID
- Each user's shop connection is properly isolated
- The duplicate key error should no longer occur

