import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';

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

    // Get reviews from Etsy API using the existing method
    // Note: The existing getShopReviews method doesn't support min_created/max_created filters
    // but we'll use it for now and extend if needed
    const reviews = await etsyAPI.getShopReviews(shopId, limit, offset);
    
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
