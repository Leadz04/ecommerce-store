# Multi-Shop & Multi-User SaaS Implementation

## Overview

This document outlines the changes made to transform the Etsy integration into a proper multi-tenant SaaS system where:
- **Multiple users** can each have their own Etsy shops
- **Each user's data is completely isolated** from other users
- **Users can connect multiple shops** and switch between them
- **All shop data (listings, orders, syncs) is user-specific**

---

## Database Schema Changes

### 1. **EtsyShop Model** (`src/models/EtsyShop.ts`)

**Added:**
- `userId: string` - Required field linking shop to user
- **Compound unique index**: `{ userId: 1, shopId: 1 }` - Ensures one shop ID per user (but different users can have the same shop ID)

**Changed:**
- Removed global unique constraint on `shopId`
- Now `shopId` must be unique **per user**, not globally

### 2. **EtsyListing Model** (`src/models/EtsyListing.ts`)

**Added:**
- `userId: string` - Required field for user ownership
- **Indexes**: 
  - `{ userId: 1, shopId: 1 }` for efficient user+shop queries
  - `{ userId: 1 }` for user-scoped queries

**Changed:**
- All queries now filter by `userId` to ensure data isolation

### 3. **EtsyOrder Model** (`src/models/EtsyOrder.ts`)

**Added:**
- `userId: string` - Required field for user ownership
- **Indexes**: 
  - `{ userId: 1, shopId: 1 }` for efficient user+shop queries
  - `{ userId: 1 }` for user-scoped queries

**Changed:**
- All queries now filter by `userId` to ensure data isolation

---

## Authentication & Authorization

### New Helper Functions (`src/lib/etsy-auth-helper.ts`)

1. **`getCurrentUserId(request)`**
   - Extracts `userId` from JWT token in Authorization header
   - Throws error if no valid token

2. **`getCurrentUserIdOptional(request)`**
   - Returns `userId` or `null` if no token (for public endpoints)

3. **`getUserShop(userId, shopId?)`**
   - Retrieves shop belonging to a specific user
   - Optionally filters by `shopId`
   - Returns `null` if shop doesn't belong to user (prevents unauthorized access)

---

## API Routes Updated

### ✅ **Fully Updated Routes:**

1. **`/api/etsy/auth`** - OAuth callback
   - Saves `userId` when connecting shops
   - Supports connecting **all shops** for a user (multi-shop)
   - Updates existing shops or creates new ones

2. **`/api/etsy/status`** - Shop status
   - Filters by `userId` (optional for backwards compatibility)
   - Returns list of all user's shops
   - Supports `?shopId=XXX` query param

3. **`/api/etsy/sync`** - Data synchronization
   - Requires `userId` authentication
   - All synced listings/orders include `userId`
   - Token refresh updates use `userId` filter

4. **`/api/etsy/listings`** - Fetch listings
   - Requires authentication
   - Validates shop belongs to user

5. **`/api/etsy/analytics`** - Analytics dashboard
   - Requires authentication
   - Validates shop belongs to user

6. **`/api/etsy/shops`** - NEW endpoint
   - `GET` - List all shops for current user
   - `DELETE ?shopId=XXX` - Disconnect/soft-delete a shop

### ⚠️ **Routes That May Need Updates:**

The following routes likely need `userId` filtering added:
- `/api/etsy/listing-optimizer`
- `/api/etsy/reviews/*`
- `/api/etsy/bulk-operations`
- `/api/etsy/repricing/*`
- `/api/etsy/listings/[listingId]`
- `/api/etsy/listing-details`
- `/api/etsy/products/sync-to-etsy`
- `/api/etsy/settings`
- `/api/etsy/inventory/sync`

**Pattern to update:**
```typescript
// OLD:
const shop = await EtsyShop.findOne({ shopId, isActive: true });

// NEW:
const userId = await getCurrentUserId(request);
const shop = await getUserShop(userId, shopId);
if (!shop) {
  return NextResponse.json({ error: 'Shop not found or access denied' }, { status: 404 });
}
```

---

## Frontend Updates Needed

### 1. **Shop Selector Component**

Create a component to:
- Fetch all user's shops via `GET /api/etsy/shops`
- Display dropdown/selector to switch between shops
- Store selected `shopId` in localStorage or context
- Pass `shopId` to all Etsy API calls

### 2. **Update All Etsy Components**

All components that call Etsy APIs should:
- Accept `shopId` prop or get from context
- Pass `shopId` in API requests
- Handle "no shop selected" state

**Components to update:**
- `EtsyListingOptimizer`
- `EtsyReviewManagement`
- `EtsyBulkOperations`
- `EtsyAnalyticsDashboard`
- `EtsyRepricingEngine`
- `EtsyMarketInsights` (public endpoint, no changes needed)

### 3. **Admin Page Integration**

Add shop selector to:
- Etsy Connection section
- Above all Etsy feature sections
- Pass selected shop to child components

---

## Migration Notes

### For Existing Data:

⚠️ **Important**: Existing shops/listings/orders **do NOT have `userId`** set.

**Migration Options:**

1. **Manual Migration Script** (recommended):
   ```typescript
   // Run once: assign all existing data to a default user
   const DEFAULT_USER_ID = 'your-default-user-id';
   await EtsyShop.updateMany({ userId: { $exists: false } }, { $set: { userId: DEFAULT_USER_ID } });
   await EtsyListing.updateMany({ userId: { $exists: false } }, { $set: { userId: DEFAULT_USER_ID } });
   await EtsyOrder.updateMany({ userId: { $exists: false } }, { $set: { userId: DEFAULT_USER_ID } });
   ```

2. **Backfill on First Access**:
   - When user accesses their shop, check if `userId` is missing
   - If missing, update all related listings/orders with current `userId`
   - ⚠️ This only works if you can determine which user owns legacy data

3. **Fresh Start**:
   - Delete all existing Etsy data
   - Users reconnect their shops
   - All new data will have proper `userId`

---

## Security Considerations

✅ **Implemented:**
- All authenticated routes require valid JWT token
- Shop queries filter by `userId` to prevent unauthorized access
- Token refresh updates filter by `userId + shopId`

⚠️ **Additional Recommendations:**
- Add middleware to verify user owns shop on **all** shop-related endpoints
- Consider adding `createdBy` field to audit trail
- Implement rate limiting per user, not just globally
- Add logging for shop access attempts

---

## Testing Checklist

- [ ] Connect multiple shops for same user
- [ ] Connect same shop ID for different users (should work)
- [ ] Verify user A cannot access user B's shops
- [ ] Verify user A cannot see user B's listings/orders
- [ ] Test shop switching in UI
- [ ] Test all Etsy features with selected shop
- [ ] Verify sync operations save correct `userId`
- [ ] Test disconnect shop functionality
- [ ] Verify analytics only show data for selected shop/user

---

## Next Steps

1. ✅ **Database models updated** - COMPLETE
2. ✅ **Auth helpers created** - COMPLETE  
3. ✅ **Core routes updated** - COMPLETE (some routes still pending)
4. ⏳ **Update remaining API routes** - IN PROGRESS
5. ⏳ **Create shop selector UI component** - PENDING
6. ⏳ **Update all frontend components** - PENDING
7. ⏳ **Write migration script** - PENDING
8. ⏳ **Add comprehensive tests** - PENDING

---

## API Usage Examples

### List User's Shops
```typescript
GET /api/etsy/shops
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "shops": [
    { "shopId": "123", "shopName": "My Shop", ... },
    { "shopId": "456", "shopName": "Second Shop", ... }
  ]
}
```

### Get Status for Specific Shop
```typescript
GET /api/etsy/status?shopId=123
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "connected": true,
  "shop": { "shopId": "123", "shopName": "My Shop", ... },
  "shops": [...], // All user's shops
  "stats": { ... }
}
```

### Sync Listings for Specific Shop
```typescript
POST /api/etsy/sync
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "listings",
  "shopId": "123"
}
```

---

## Questions / Issues?

- Check that all API routes use `getUserShop(userId, shopId)` pattern
- Verify all database queries include `userId` filter
- Ensure frontend passes `shopId` in all requests
- Test with multiple users and shops to verify isolation
