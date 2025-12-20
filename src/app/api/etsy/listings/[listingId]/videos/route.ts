import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/listings/[listingId]/videos
 * Get videos for a listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { listingId } = await params;
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

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

    // Check cache first
    const cacheKey = generateCacheKey('listing-videos', { listingId });
    const cachedVideos = await getCachedData<any[]>(cacheKey, userId);
    
    if (cachedVideos) {
      return NextResponse.json({
        success: true,
        results: cachedVideos,
      });
    }
    
    // Fetch from Etsy API
    const response = await etsyAPI['makeRequest'](`/application/listings/${listingId}/videos`);
    const videos = response.results || [];
    
    // Save to cache
    await setCachedData(cacheKey, userId, videos, CACHE_TTL.LISTING_VIDEOS, shopId, listingId);

    return NextResponse.json({
      success: true,
      results: videos,
    });
  } catch (error: any) {
    console.error('[Etsy Listing Videos API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch listing videos' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
