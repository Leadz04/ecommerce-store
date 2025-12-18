/**
 * Etsy API Cache Utility
 * Provides helper functions for caching Etsy API responses in MongoDB
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Cache expiration times (in milliseconds)
export const CACHE_TTL = {
  LISTING: 6 * 60 * 60 * 1000, // 6 hours
  LISTING_IMAGES: 24 * 60 * 60 * 1000, // 24 hours
  LISTING_VIDEOS: 24 * 60 * 60 * 1000, // 24 hours
  LISTING_INVENTORY: 1 * 60 * 60 * 1000, // 1 hour
  SHOP: 24 * 60 * 60 * 1000, // 24 hours
  SHIPPING_PROFILES: 24 * 60 * 60 * 1000, // 24 hours
  SHOP_SECTIONS: 24 * 60 * 60 * 1000, // 24 hours
  RETURN_POLICIES: 24 * 60 * 60 * 1000, // 24 hours
  RECEIPTS: 1 * 60 * 60 * 1000, // 1 hour
  REVIEWS: 6 * 60 * 60 * 1000, // 6 hours
  PAYMENTS: 1 * 60 * 60 * 1000, // 1 hour
  LEDGER: 1 * 60 * 60 * 1000, // 1 hour
  TAXONOMY_PROPERTIES: 7 * 24 * 60 * 60 * 1000, // 7 days (rarely changes)
};

export interface ICacheEntry extends Document {
  cacheKey: string;
  userId: string;
  shopId?: string;
  listingId?: string;
  data: any;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CacheEntrySchema = new Schema<ICacheEntry>({
  cacheKey: { type: String, required: true },
  userId: { type: String, required: true },
  shopId: { type: String },
  listingId: { type: String },
  data: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true
});

// Single field indexes
CacheEntrySchema.index({ cacheKey: 1 });
CacheEntrySchema.index({ userId: 1 });
CacheEntrySchema.index({ shopId: 1 });
CacheEntrySchema.index({ listingId: 1 });
CacheEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Compound indexes for efficient queries
CacheEntrySchema.index({ cacheKey: 1, userId: 1 }, { unique: true });
CacheEntrySchema.index({ userId: 1, shopId: 1 });

const CacheEntry = mongoose.models.EtsyCacheEntry || mongoose.model<ICacheEntry>('EtsyCacheEntry', CacheEntrySchema);

/**
 * Generate a cache key for a specific resource
 */
export function generateCacheKey(type: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `etsy:${type}:${sortedParams}`;
}

/**
 * Check if cached data exists and is still valid
 */
export async function getCachedData<T>(
  cacheKey: string,
  userId: string
): Promise<T | null> {
  try {
    const cached = await CacheEntry.findOne({
      cacheKey,
      userId,
      expiresAt: { $gt: new Date() }
    }).lean();

    if (cached) {
      console.log(`[Cache HIT] Key: ${cacheKey.substring(0, 60)}...`);
      return cached.data as T;
    }
    console.log(`[Cache MISS] Key: ${cacheKey.substring(0, 60)}...`);
    return null;
  } catch (error) {
    console.error('[Cache] Error getting cached data:', error);
    return null;
  }
}

/**
 * Save data to cache
 */
export async function setCachedData<T>(
  cacheKey: string,
  userId: string,
  data: T,
  ttl: number,
  shopId?: string,
  listingId?: string
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttl);

    await CacheEntry.findOneAndUpdate(
      { cacheKey, userId },
      {
        cacheKey,
        userId,
        shopId,
        listingId,
        data,
        expiresAt,
      },
      { upsert: true, new: true }
    );
    console.log(`[Cache SET] Key: ${cacheKey.substring(0, 60)}..., TTL: ${Math.round(ttl / 1000 / 60)} minutes`);
  } catch (error) {
    console.error('[Cache] Error setting cached data:', error);
    // Don't throw - caching failures shouldn't break the API
  }
}

/**
 * Invalidate cache entries matching criteria
 */
export async function invalidateCache(
  userId: string,
  filters?: {
    shopId?: string;
    listingId?: string;
    cacheKeyPattern?: string;
  }
): Promise<void> {
  try {
    const query: any = { userId };
    
    if (filters?.shopId) {
      query.shopId = filters.shopId;
    }
    
    if (filters?.listingId) {
      query.listingId = filters.listingId;
    }
    
    if (filters?.cacheKeyPattern) {
      query.cacheKey = { $regex: filters.cacheKeyPattern };
    }

    await CacheEntry.deleteMany(query);
  } catch (error) {
    console.error('[Cache] Error invalidating cache:', error);
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    await CacheEntry.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  } catch (error) {
    console.error('[Cache] Error clearing expired cache:', error);
  }
}

/**
 * Standardized DB-first caching pattern helper
 * Pattern: Check DB → Check Cache → Call Etsy API → Update DB & Cache
 * 
 * @param options Configuration options
 * @returns Cached or fresh data
 */
export async function getDataWithCache<T>(options: {
  userId: string;
  shopId?: string;
  listingId?: string;
  cacheKey: string;
  cacheTTL: number;
  forceRefresh?: boolean;
  dbQuery: () => Promise<T | null>;
  dbUpdate: (data: T) => Promise<void>;
  apiFetch: () => Promise<T>;
}): Promise<{ data: T; fromCache: boolean; fromDB: boolean }> {
  const { 
    userId, 
    shopId, 
    listingId,
    cacheKey, 
    cacheTTL, 
    forceRefresh = false,
    dbQuery, 
    dbUpdate, 
    apiFetch 
  } = options;

  // Step 1: Check DB first (if not forcing refresh)
  if (!forceRefresh) {
    try {
      const dbData = await dbQuery();
      if (dbData) {
        console.log(`[DB HIT] Found data in database for key: ${cacheKey.substring(0, 60)}...`);
        // Also ensure it's in cache for faster subsequent access
        await setCachedData(cacheKey, userId, dbData, cacheTTL, shopId, listingId);
        return { data: dbData, fromCache: false, fromDB: true };
      }
    } catch (error) {
      console.warn('[DB Query] Error querying database:', error);
    }
  }

  // Step 2: Check cache (if not forcing refresh)
  if (!forceRefresh) {
    const cachedData = await getCachedData<T>(cacheKey, userId);
    if (cachedData) {
      console.log(`[Cache HIT] Found data in cache for key: ${cacheKey.substring(0, 60)}...`);
      // Update DB with cached data for consistency
      try {
        await dbUpdate(cachedData);
      } catch (error) {
        console.warn('[DB Update] Error updating DB from cache:', error);
      }
      return { data: cachedData, fromCache: true, fromDB: false };
    }
  }

  // Step 3: Fetch from Etsy API
  console.log(`[API Fetch] Fetching fresh data from Etsy API for key: ${cacheKey.substring(0, 60)}...`);
  const apiData = await apiFetch();

  // Step 4: Update both DB and Cache
  try {
    await dbUpdate(apiData);
    await setCachedData(cacheKey, userId, apiData, cacheTTL, shopId, listingId);
  } catch (error) {
    console.warn('[Update] Error updating DB/Cache:', error);
  }

  return { data: apiData, fromCache: false, fromDB: false };
}

export { CacheEntry };
