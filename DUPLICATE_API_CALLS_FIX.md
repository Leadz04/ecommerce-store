# Duplicate API Calls Fix - Summary

## Issues Found and Fixed

### 1. **ProductFAQ Component**
**Problem**: Multiple duplicate calls to `/api/products/[id]/generate-faqs` and `/api/seo/related-questions`
- Component was re-rendering and triggering useEffect multiple times
- Missing guards to prevent concurrent fetches
- Dependencies on `productName` and `productDescription` causing unnecessary re-fetches

**Fix**:
- ✅ Added `isFetchingRef` to prevent concurrent fetches
- ✅ Changed useEffect dependency to only `productId` (most stable)
- ✅ Added request deduplication using `requestDeduplicator`
- ✅ Removed duplicate `related-questions` call (was being called twice)

### 2. **ProductRecommendations Component**
**Problem**: Multiple duplicate calls for each recommendation type
- Component rendered twice (you_may_like and frequently_bought)
- No deduplication for concurrent requests
- useEffect triggering on every render

**Fix**:
- ✅ Added `hasFetchedRef` and `lastKeyRef` to track fetched requests
- ✅ Added `isFetchingRef` to prevent concurrent fetches
- ✅ Added request deduplication
- ✅ Unique key per productId + type combination

### 3. **ProductQA Component**
**Problem**: Duplicate calls to `/api/products/[id]/questions?status=approved`
- No guards against concurrent fetches
- useEffect triggering multiple times

**Fix**:
- ✅ Added `hasFetchedRef` and `lastProductIdRef` to track fetches
- ✅ Added `isFetchingRef` to prevent concurrent fetches
- ✅ Added request deduplication

### 4. **SalesCounter Component**
**Problem**: Duplicate calls to `/api/products/[id]/sales-count`
- Interval was calling fetch even if already fetching
- No guards against concurrent fetches

**Fix**:
- ✅ Added `hasFetchedRef` and `lastProductIdRef` to track fetches
- ✅ Added `isFetchingRef` to prevent concurrent fetches
- ✅ Added check in interval to skip if already fetching
- ✅ Added request deduplication

## New Utility: Request Deduplication

Created `src/lib/requestDeduplication.ts` - A utility that:
- Prevents duplicate API calls from happening simultaneously
- Caches requests for 5 seconds to handle rapid re-renders
- Automatically cleans up stale requests
- Works across all components

### Usage:
```typescript
import { requestDeduplicator } from '@/lib/requestDeduplication';

// Instead of:
const response = await fetch('/api/endpoint');

// Use:
const response = await requestDeduplicator.deduplicate(
  'unique-key-for-this-request',
  () => fetch('/api/endpoint')
);
```

## Performance Improvements

### Before:
- ❌ Multiple duplicate API calls on page load
- ❌ Concurrent requests for the same data
- ❌ Unnecessary re-fetches on re-renders
- ❌ No request deduplication

### After:
- ✅ Single API call per endpoint per product
- ✅ Request deduplication prevents concurrent duplicates
- ✅ Refs prevent unnecessary re-fetches
- ✅ Optimized useEffect dependencies
- ✅ Better error handling

## Expected Results

After these fixes, you should see:
1. **One call** to `/api/products/[id]/generate-faqs` per product
2. **One call** to `/api/seo/related-questions` per product (if needed)
3. **One call** per recommendation type (you_may_like, frequently_bought)
4. **One call** to `/api/products/[id]/questions?status=approved` per product
5. **One call** to `/api/products/[id]/sales-count` per product

## Testing

To verify the fixes:
1. Open browser DevTools → Network tab
2. Navigate to a product detail page
3. Check that each API endpoint is called only once
4. Refresh the page - should still see single calls
5. Navigate to another product - should see new calls (not duplicates)

## Database Migration

Don't forget to run the migration for FAQ fields:
```bash
npm run migrate:up
```

This adds the new fields to store FAQs in the database.

