import { EtsyListing, Product } from '@/models';
import mongoose from 'mongoose';

/**
 * Optimized methods to track products synced to Etsy
 */

/**
 * Get all productIds that are synced to Etsy (for a specific shop or all shops)
 * OPTIMIZED: Uses distinct() with index on productId
 */
export async function getSyncedProductIds(options?: {
  shopId?: string;
  userId?: string;
  state?: 'active' | 'inactive' | 'draft';
  excludeNull?: boolean; // Exclude listings without productId
}): Promise<string[]> {
  const query: any = {};
  
  if (options?.shopId) query.shopId = options.shopId;
  if (options?.userId) query.userId = options.userId;
  if (options?.state) query.state = options.state;
  if (options?.excludeNull !== false) {
    query.productId = { $exists: true, $ne: null };
  }

  // Uses index on productId - very fast
  const productIds = await EtsyListing.distinct('productId', query);
  return productIds.filter(id => id != null) as string[];
}

/**
 * Check if a specific product is synced to Etsy
 * OPTIMIZED: Uses indexed query on productId + shopId
 */
export async function isProductSyncedToEtsy(
  productId: string,
  shopId?: string
): Promise<boolean> {
  const query: any = { productId };
  if (shopId) query.shopId = shopId;

  // Uses compound index { productId: 1, shopId: 1 } - very fast
  const count = await EtsyListing.countDocuments(query);
  return count > 0;
}

/**
 * Get Etsy listing details for a product
 * OPTIMIZED: Returns first matching listing (or all if shopId not provided)
 */
export async function getProductEtsyListings(
  productId: string,
  shopId?: string
): Promise<any[]> {
  const query: any = { productId };
  if (shopId) query.shopId = shopId;

  return EtsyListing.find(query)
    .select('etsyListingId shopId state title price lastSyncedAt')
    .lean();
}

/**
 * Get products with their Etsy sync status
 * OPTIMIZED: Uses aggregation pipeline for efficient join
 */
export async function getProductsWithSyncStatus(options?: {
  shopId?: string;
  userId?: string;
  productIds?: string[];
  includeUnsynced?: boolean;
}): Promise<Array<{
  product: any;
  isSynced: boolean;
  etsyListings: Array<{
    etsyListingId: string;
    shopId: string;
    state: string;
    lastSyncedAt: Date;
  }>;
}>> {
  const matchStage: any = {};
  if (options?.shopId) matchStage.shopId = options.shopId;
  if (options?.userId) matchStage.userId = options.userId;
  if (options?.productIds) {
    matchStage.productId = { $in: options.productIds };
  }
  matchStage.productId = { $exists: true, $ne: null };

  // Get all synced productIds
  const syncedProductIds = await EtsyListing.distinct('productId', matchStage);

  // Build product query
  const productQuery: any = {};
  if (options?.productIds) {
    productQuery._id = { $in: options.productIds.map(id => new mongoose.Types.ObjectId(id)) };
  } else if (!options?.includeUnsynced) {
    // Only get synced products
    productQuery._id = { $in: syncedProductIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  const products = await Product.find(productQuery).lean();

  // Get all listings for these products
  const listingsMap = new Map<string, any[]>();
  if (syncedProductIds.length > 0) {
    const listings = await EtsyListing.find({
      productId: { $in: syncedProductIds },
      ...(options?.shopId ? { shopId: options.shopId } : {}),
    })
      .select('productId etsyListingId shopId state lastSyncedAt')
      .lean();

    // Group listings by productId
    listings.forEach(listing => {
      const pid = listing.productId as string;
      if (!listingsMap.has(pid)) {
        listingsMap.set(pid, []);
      }
      listingsMap.get(pid)!.push({
        etsyListingId: listing.etsyListingId,
        shopId: listing.shopId,
        state: listing.state,
        lastSyncedAt: listing.lastSyncedAt,
      });
    });
  }

  // Combine products with sync status
  return products.map(product => {
    const productId = product._id.toString();
    const listings = listingsMap.get(productId) || [];
    return {
      product,
      isSynced: listings.length > 0,
      etsyListings: listings,
    };
  });
}

/**
 * Get count of synced products (very fast)
 * OPTIMIZED: Uses countDocuments with index
 */
export async function getSyncedProductCount(options?: {
  shopId?: string;
  userId?: string;
  state?: 'active' | 'inactive' | 'draft';
}): Promise<number> {
  const query: any = { productId: { $exists: true, $ne: null } };
  
  if (options?.shopId) query.shopId = options.shopId;
  if (options?.userId) query.userId = options.userId;
  if (options?.state) query.state = options.state;

  // Uses index on productId - very fast
  return EtsyListing.countDocuments(query);
}

/**
 * Get products that are NOT synced to Etsy
 * OPTIMIZED: Uses $nin to exclude synced productIds
 */
export async function getUnsyncedProducts(options?: {
  shopId?: string;
  userId?: string;
  limit?: number;
}): Promise<any[]> {
  // Get synced productIds
  const syncedProductIds = await getSyncedProductIds({
    shopId: options?.shopId,
    userId: options?.userId,
  });

  // Get products NOT in synced list
  const query: any = {};
  if (syncedProductIds.length > 0) {
    query._id = { $nin: syncedProductIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  const products = await Product.find(query)
    .limit(options?.limit || 100)
    .select('_id name image price category brand')
    .lean();

  return products;
}

/**
 * Batch check sync status for multiple products
 * OPTIMIZED: Single query with $in operator
 */
export async function batchCheckSyncStatus(
  productIds: string[],
  shopId?: string
): Promise<Map<string, boolean>> {
  if (productIds.length === 0) return new Map();

  const query: any = {
    productId: { $in: productIds },
  };
  if (shopId) query.shopId = shopId;

  // Single query with index - very efficient
  const syncedListings = await EtsyListing.find(query)
    .select('productId')
    .lean();

  const syncedSet = new Set(syncedListings.map(l => l.productId as string));
  const result = new Map<string, boolean>();
  
  productIds.forEach(id => {
    result.set(id, syncedSet.has(id));
  });

  return result;
}

/**
 * Get sync statistics
 * OPTIMIZED: Uses aggregation pipeline
 */
export async function getSyncStatistics(options?: {
  shopId?: string;
  userId?: string;
}): Promise<{
  totalSynced: number;
  totalUnsynced: number;
  byState: {
    active: number;
    inactive: number;
    draft: number;
  };
  byShop: Array<{ shopId: string; count: number }>;
}> {
  const matchStage: any = { productId: { $exists: true, $ne: null } };
  if (options?.shopId) matchStage.shopId = options.shopId;
  if (options?.userId) matchStage.userId = options.userId;

  const [totalSynced, byState, byShop] = await Promise.all([
    // Total synced products
    EtsyListing.distinct('productId', matchStage).then(ids => ids.length),
    
    // By state
    EtsyListing.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$state',
          count: { $addToSet: '$productId' },
        },
      },
      {
        $project: {
          state: '$_id',
          count: { $size: '$count' },
        },
      },
    ]),
    
    // By shop
    EtsyListing.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$shopId',
          count: { $addToSet: '$productId' },
        },
      },
      {
        $project: {
          shopId: '$_id',
          count: { $size: '$count' },
        },
      },
    ]),
  ]);

  // Get total products count
  const totalProducts = await Product.countDocuments({});
  const totalUnsynced = totalProducts - totalSynced;

  // Format byState
  const byStateMap: any = { active: 0, inactive: 0, draft: 0 };
  byState.forEach(item => {
    if (item.state in byStateMap) {
      byStateMap[item.state] = item.count;
    }
  });

  return {
    totalSynced,
    totalUnsynced,
    byState: byStateMap,
    byShop: byShop.map(item => ({
      shopId: item.shopId,
      count: item.count,
    })),
  };
}
