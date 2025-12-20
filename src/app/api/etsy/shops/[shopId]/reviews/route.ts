import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/reviews
 * Get shop reviews - matches Business Suite component expectations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const minCreated = searchParams.get('min_created') ? parseInt(searchParams.get('min_created')!, 10) : undefined;
    const maxCreated = searchParams.get('max_created') ? parseInt(searchParams.get('max_created')!, 10) : undefined;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

    // Create EtsyAPI instance with token refresh callback
    const etsyAPI = new EtsyAPI(
      shop.accessToken,
      shop.shopId,
      shop.refreshToken,
      async (newTokens) => {
        await EtsyShop.updateOne(
          { userId: shop.userId, shopId: shop.shopId },
          {
            $set: {
              accessToken: newTokens.access_token,
              refreshToken: newTokens.refresh_token,
              tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
            }
          }
        );
      }
    );

    // Invalidate cache if force refresh requested
    if (forceRefresh) {
      await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-reviews' });
    }

    // Check cache first (unless forcing refresh)
    const cacheKey = generateCacheKey('shop-reviews', { shopId, limit, offset, minCreated, maxCreated });
    const cachedReviews = await getCachedData<any[]>(cacheKey, userId);
    
    let reviews: any[] = [];
    if (cachedReviews && !forceRefresh) {
      reviews = cachedReviews;
    } else {
      // Get reviews from Etsy API using the existing method
      reviews = await etsyAPI.getShopReviews(shopId, limit, offset);
      
      // Save to cache
      await setCachedData(cacheKey, userId, reviews, CACHE_TTL.REVIEWS, shopId);
    }
    
    // Filter by date range if provided
    let filteredReviews = reviews;
    if (minCreated || maxCreated) {
      filteredReviews = reviews.filter((review: any) => {
        const createTs = review.create_timestamp || review.createTimestamp;
        if (minCreated && createTs < minCreated) return false;
        if (maxCreated && createTs > maxCreated) return false;
        return true;
      });
    }

    // Transform reviews to match component expectations
    const transformedReviews = reviews.map((review: any) => ({
      listingId: review.listing_id,
      shopId: review.shop_id,
      transactionId: review.transaction_id,
      buyerUserId: review.buyer_user_id,
      rating: review.rating,
      review: review.review,
      language: review.language,
      imageUrlFullxFull: review.image_url_fullxfull,
      createTimestamp: review.create_timestamp,
      updateTimestamp: review.update_timestamp,
    }));

    return NextResponse.json({
      success: true,
      results: transformedReviews,
      count: transformedReviews.length,
    });
  } catch (error: any) {
    console.error('[Etsy Shop Reviews API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch reviews' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
