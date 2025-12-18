# Etsy Sync Status - Testing Guide

## Summary of Changes

### Models Changed
- **EtsyListing Model** (`src/models/EtsyListing.ts`):
  - ✅ Added **indexes only** (no schema changes):
    - Index on `productId` for fast lookups
    - Compound index `{ productId: 1, shopId: 1 }` for product+shop queries
    - Index `{ state: 1, productId: 1 }` for state filtering
  - ⚠️ **No breaking changes** - existing data remains compatible

### Product Model
- ✅ **No changes** to Product model

### New Files Created
1. `src/lib/etsy-product-tracker.ts` - Optimized utility functions
2. `src/app/api/etsy/products/sync-status/route.ts` - Sync status API endpoint
3. `docs/ETSY_SYNC_STATUS_TESTING.md` - This testing guide

### Files Modified
1. `src/models/EtsyListing.ts` - Added indexes (non-breaking)
2. `src/app/api/admin/products/route.ts` - Added optional Etsy sync status

---

## Testing Methods

### 1. Test Database Indexes

**Check if indexes were created:**
```bash
# Connect to MongoDB
mongosh your-database-name

# Check indexes on EtsyListing collection
db.etsylistings.getIndexes()

# You should see:
# - productId_1
# - productId_1_shopId_1
# - state_1_productId_1
```

**Manual Index Creation (if needed):**
```javascript
// In MongoDB shell
db.etsylistings.createIndex({ productId: 1 });
db.etsylistings.createIndex({ productId: 1, shopId: 1 });
db.etsylistings.createIndex({ state: 1, productId: 1 });
```

---

### 2. Test Sync Status API Endpoint

#### A. Get All Synced Product IDs
```bash
curl -X GET "http://localhost:3000/api/etsy/products/sync-status?shopId=YOUR_SHOP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "productIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "count": 2
}
```

#### B. Check Single Product
```bash
curl -X GET "http://localhost:3000/api/etsy/products/sync-status?action=check&productId=507f1f77bcf86cd799439011&shopId=YOUR_SHOP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "productId": "507f1f77bcf86cd799439011",
  "isSynced": true,
  "listings": [
    {
      "etsyListingId": "123456789",
      "shopId": "YOUR_SHOP_ID",
      "state": "active",
      "lastSyncedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### C. Batch Check Multiple Products
```bash
curl -X GET "http://localhost:3000/api/etsy/products/sync-status?action=batch&productIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012&shopId=YOUR_SHOP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "507f1f77bcf86cd799439011": true,
    "507f1f77bcf86cd799439012": false
  },
  "synced": ["507f1f77bcf86cd799439011"],
  "unsynced": ["507f1f77bcf86cd799439012"]
}
```

#### D. Get Sync Statistics
```bash
curl -X GET "http://localhost:3000/api/etsy/products/sync-status?action=stats&shopId=YOUR_SHOP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalSynced": 150,
    "totalUnsynced": 850,
    "byState": {
      "active": 120,
      "inactive": 20,
      "draft": 10
    },
    "byShop": [
      { "shopId": "shop1", "count": 100 },
      { "shopId": "shop2", "count": 50 }
    ]
  }
}
```

#### E. Get Unsynced Products
```bash
curl -X GET "http://localhost:3000/api/etsy/products/sync-status?action=unsynced&shopId=YOUR_SHOP_ID&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Test Admin Products API with Sync Status

#### Get Products with Etsy Sync Status
```bash
curl -X GET "http://localhost:3000/api/admin/products?includeEtsySync=true&etsyShopId=YOUR_SHOP_ID&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Product Name",
      "price": 99.99,
      "etsySync": {
        "isSynced": true,
        "listings": [
          {
            "etsyListingId": "123456789",
            "shopId": "YOUR_SHOP_ID",
            "state": "active",
            "lastSyncedAt": "2024-01-15T10:30:00.000Z"
          }
        ]
      }
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Another Product",
      "price": 49.99,
      "etsySync": {
        "isSynced": false,
        "listings": []
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50
  }
}
```

---

### 4. Test Utility Functions Directly

Create a test script: `scripts/test-etsy-sync-status.ts`

```typescript
import connectDB from '../src/lib/mongodb';
import {
  getSyncedProductIds,
  isProductSyncedToEtsy,
  batchCheckSyncStatus,
  getSyncStatistics,
} from '../src/lib/etsy-product-tracker';

async function testSyncStatus() {
  await connectDB();
  
  const shopId = 'YOUR_SHOP_ID';
  const productId = 'YOUR_PRODUCT_ID';
  
  console.log('=== Testing Etsy Sync Status ===\n');
  
  // Test 1: Get synced product IDs
  console.log('1. Getting synced product IDs...');
  const syncedIds = await getSyncedProductIds({ shopId });
  console.log(`   Found ${syncedIds.length} synced products`);
  console.log(`   First 5 IDs:`, syncedIds.slice(0, 5));
  
  // Test 2: Check single product
  console.log('\n2. Checking single product...');
  const isSynced = await isProductSyncedToEtsy(productId, shopId);
  console.log(`   Product ${productId} is synced:`, isSynced);
  
  // Test 3: Batch check
  console.log('\n3. Batch checking products...');
  const testIds = syncedIds.slice(0, 10);
  const batchResult = await batchCheckSyncStatus(testIds, shopId);
  console.log(`   Checked ${testIds.length} products`);
  console.log(`   Synced: ${Array.from(batchResult.values()).filter(Boolean).length}`);
  
  // Test 4: Get statistics
  console.log('\n4. Getting statistics...');
  const stats = await getSyncStatistics({ shopId });
  console.log('   Stats:', JSON.stringify(stats, null, 2));
  
  console.log('\n=== Tests Complete ===');
  process.exit(0);
}

testSyncStatus().catch(console.error);
```

**Run the test:**
```bash
npx tsx scripts/test-etsy-sync-status.ts
```

---

### 5. Performance Testing

#### Test Query Performance
```javascript
// In MongoDB shell
db.etsylistings.find({ productId: "507f1f77bcf86cd799439011" }).explain("executionStats")

// Check if index is used (should see "IXSCAN" on productId_1)
```

#### Benchmark Before/After
```bash
# Before indexes (if you have old data)
time curl "http://localhost:3000/api/etsy/products/sync-status?action=batch&productIds=id1,id2,id3"

# After indexes
time curl "http://localhost:3000/api/etsy/products/sync-status?action=batch&productIds=id1,id2,id3"
```

---

### 6. Frontend Integration Test

Update your frontend to use the new sync status:

```typescript
// In your React component
const fetchProductsWithSyncStatus = async (shopId: string) => {
  const response = await fetch(
    `/api/admin/products?includeEtsySync=true&etsyShopId=${shopId}&page=1&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  const data = await response.json();
  
  // Products now have etsySync field
  data.products.forEach((product: any) => {
    if (product.etsySync?.isSynced) {
      console.log(`${product.name} is synced to Etsy`);
      console.log(`Listings:`, product.etsySync.listings);
    }
  });
  
  return data;
};
```

---

### 7. Integration Test Checklist

- [ ] Indexes created successfully in MongoDB
- [ ] Sync status API returns correct data
- [ ] Batch check works for multiple products
- [ ] Admin products API includes sync status when requested
- [ ] Performance is acceptable (< 100ms for batch checks)
- [ ] Frontend displays sync status correctly
- [ ] No errors in console/logs
- [ ] Works with multiple shops
- [ ] Handles products without listings gracefully

---

### 8. Common Issues & Solutions

#### Issue: Indexes not created
**Solution:** Run MongoDB index creation manually or restart the app (indexes are created on model load)

#### Issue: Slow queries
**Solution:** Verify indexes exist: `db.etsylistings.getIndexes()`

#### Issue: Empty results
**Solution:** 
- Check if products have `productId` set in EtsyListing collection
- Verify shopId matches your actual shop ID

#### Issue: TypeScript errors
**Solution:** Ensure all imports are correct and types are properly exported

---

## Quick Test Commands

```bash
# 1. Test sync status endpoint
curl "http://localhost:3000/api/etsy/products/sync-status?action=stats"

# 2. Test admin products with sync
curl "http://localhost:3000/api/admin/products?includeEtsySync=true&limit=5"

# 3. Check specific product
curl "http://localhost:3000/api/etsy/products/sync-status?action=check&productId=YOUR_PRODUCT_ID"
```

---

## Next Steps

1. ✅ Test all endpoints
2. ✅ Verify indexes are created
3. ✅ Update frontend to use sync status
4. ✅ Monitor performance in production
5. ✅ Consider adding caching for frequently accessed data
