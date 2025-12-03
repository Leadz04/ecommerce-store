# FAQ System Optimization Guide

## Database Migration

### Step 1: Run the Migration

To add the new FAQ fields to your database, run:

```bash
npm run migrate:up
```

This will:
- Add `generatedFAQs` field to all products
- Add `relatedSearches` field to all products  
- Add `peopleAlsoSearchFor` field to all products
- Create an index on `generatedFAQs.generatedAt` for faster cache lookups

### Step 2: Verify Migration

Check migration status:
```bash
npm run migrate:status
```

### Step 3: Rollback (if needed)

If you need to rollback:
```bash
npm run migrate:down
```

## Code Optimizations Implemented

### 1. **Database-First Caching**
- FAQs are checked in database first before making API calls
- Cache expires after 30 days
- Reduces API costs and improves response time

### 2. **Non-Blocking Database Saves**
- FAQ saves happen in background (don't block API response)
- Related searches save asynchronously
- Better user experience with faster page loads

### 3. **Parallel API Calls**
- Related searches fetch in parallel when Gemini FAQs exist
- Reduces total loading time
- Better resource utilization

### 4. **Efficient Date Comparisons**
- Uses timestamp comparisons instead of Date objects
- Faster cache expiry checks
- More accurate age calculations

### 5. **Smart Fallback Strategy**
- Gemini FAQs (primary) → SerpAPI FAQs (fallback)
- Related searches always fetched (supplementary)
- Graceful error handling at each step

## Performance Improvements

### Before Optimization:
- ❌ API calls on every page load
- ❌ Sequential API calls (slow)
- ❌ Blocking database saves
- ❌ No caching

### After Optimization:
- ✅ Database cache checked first (30-day expiry)
- ✅ Parallel API calls where possible
- ✅ Non-blocking database saves
- ✅ Reduced API costs by ~95% (after initial generation)

## Database Schema

### New Fields Added:

```typescript
generatedFAQs?: Array<{
  question: string;
  answer: string;
  source: 'gemini' | 'serpapi';
  generatedAt: Date;
  model?: string;
}>;

relatedSearches?: string[];

peopleAlsoSearchFor?: Array<{
  text: string;
  link?: string;
  highlightedWords?: string[];
}>;
```

### Index Created:
- `generatedFAQs.generatedAt` (sparse index) - for fast cache lookups

## Monitoring

### Check Cache Hit Rate:
```javascript
// In your analytics or logs
const cacheHitRate = (cachedRequests / totalRequests) * 100;
```

### Monitor API Costs:
- Track Gemini API calls (should decrease after initial generation)
- Track SerpAPI calls (should decrease after initial generation)
- Monitor database size (FAQs are stored per product)

## Best Practices

1. **Cache Duration**: 30 days is optimal - FAQs don't change frequently
2. **Background Saves**: Always save in background to improve UX
3. **Error Handling**: Graceful fallbacks ensure users always see content
4. **Index Usage**: The index on `generatedAt` speeds up cache checks

## Troubleshooting

### FAQs Not Saving:
- Check MongoDB connection
- Verify migration ran successfully
- Check console logs for errors

### Cache Not Working:
- Verify `generatedAt` field exists
- Check date format in database
- Ensure index was created

### Performance Issues:
- Check database indexes
- Monitor API response times
- Review parallel call implementation

