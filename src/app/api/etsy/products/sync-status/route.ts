import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUserIdOptional } from '@/lib/etsy-auth-helper';
import {
  getSyncedProductIds,
  isProductSyncedToEtsy,
  getProductsWithSyncStatus,
  getSyncedProductCount,
  getUnsyncedProducts,
  batchCheckSyncStatus,
  getSyncStatistics,
} from '@/lib/etsy-product-tracker';

/**
 * GET /api/etsy/products/sync-status
 * Get sync status for products
 * 
 * Query params:
 * - productId: Check specific product
 * - productIds: Comma-separated list of productIds to check
 * - shopId: Filter by shop
 * - state: Filter by listing state (active/inactive/draft)
 * - action: 
 *   - 'list' - Get list of synced productIds (default)
 *   - 'check' - Check if product(s) are synced
 *   - 'products' - Get products with sync status
 *   - 'count' - Get count of synced products
 *   - 'unsynced' - Get unsynced products
 *   - 'batch' - Batch check multiple products
 *   - 'stats' - Get sync statistics
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getCurrentUserIdOptional(request);
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('productId');
    const productIdsParam = searchParams.get('productIds');
    const shopId = searchParams.get('shopId') || undefined;
    const state = searchParams.get('state') as 'active' | 'inactive' | 'draft' | null;
    const action = searchParams.get('action') || 'list';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Parse productIds if provided
    const productIds = productIdsParam 
      ? productIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      : undefined;

    switch (action) {
      case 'check': {
        // Check if specific product is synced
        if (!productId) {
          return NextResponse.json(
            { error: 'productId is required for check action' },
            { status: 400 }
          );
        }

        const isSynced = await isProductSyncedToEtsy(productId, shopId);
        const listings = await getProductsWithSyncStatus({
          productIds: [productId],
          shopId,
        });

        return NextResponse.json({
          success: true,
          productId,
          isSynced,
          listings: listings[0]?.etsyListings || [],
        });
      }

      case 'batch': {
        // Batch check multiple products
        if (!productIds || productIds.length === 0) {
          return NextResponse.json(
            { error: 'productIds is required for batch action' },
            { status: 400 }
          );
        }

        const syncStatusMap = await batchCheckSyncStatus(productIds, shopId);
        const result = Object.fromEntries(syncStatusMap);

        return NextResponse.json({
          success: true,
          results: result,
          synced: Array.from(syncStatusMap.entries())
            .filter(([_, isSynced]) => isSynced)
            .map(([id]) => id),
          unsynced: Array.from(syncStatusMap.entries())
            .filter(([_, isSynced]) => !isSynced)
            .map(([id]) => id),
        });
      }

      case 'products': {
        // Get products with sync status
        const products = await getProductsWithSyncStatus({
          shopId,
          userId,
          productIds,
          includeUnsynced: true,
        });

        return NextResponse.json({
          success: true,
          products,
          count: products.length,
        });
      }

      case 'count': {
        // Get count of synced products
        const count = await getSyncedProductCount({
          shopId,
          userId,
          state: state || undefined,
        });

        return NextResponse.json({
          success: true,
          count,
        });
      }

      case 'unsynced': {
        // Get unsynced products
        const products = await getUnsyncedProducts({
          shopId,
          userId,
          limit,
        });

        return NextResponse.json({
          success: true,
          products,
          count: products.length,
        });
      }

      case 'stats': {
        // Get sync statistics
        const stats = await getSyncStatistics({
          shopId,
          userId,
        });

        return NextResponse.json({
          success: true,
          stats,
        });
      }

      case 'list':
      default: {
        // Get list of synced productIds (default)
        const syncedProductIds = await getSyncedProductIds({
          shopId,
          userId,
          state: state || undefined,
        });

        return NextResponse.json({
          success: true,
          productIds: syncedProductIds,
          count: syncedProductIds.length,
        });
      }
    }
  } catch (error: any) {
    console.error('[Etsy Sync Status API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to get sync status',
      },
      { status: 500 }
    );
  }
}
