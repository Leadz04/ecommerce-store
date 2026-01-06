import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL, invalidateCache } from '@/lib/etsy-cache';

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
    const videos = await etsyAPI.getListingVideos(listingId);

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

/**
 * POST /api/etsy/listings/[listingId]/videos
 * Upload a video to a listing
 */
export async function POST(
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

    const formData = await request.formData();
    const result = await etsyAPI.uploadListingVideo(listingId, formData);

    await invalidateCache(userId, { shopId, listingId });

    return NextResponse.json({
      success: true,
      result: result,
    });
  } catch (error: any) {
    console.error('[Etsy Upload Video API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/etsy/listings/[listingId]/videos
 * Delete a video from a listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { listingId } = await params;
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    // For DELETE, specific videoId is passed (either as query param or part of path in component)
    // Component sends DELETE to .../videos/videoId, but since this is ...params...
    // Wait, nextjs app router [listingId]/videos route handles /api/etsy/listings/123/videos
    // It does NOT automatically handle /api/etsy/listings/123/videos/456 unless we have another route.
    // So I should expect videoId as query param here.
    const videoId = searchParams.get('videoId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }
    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
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

    await etsyAPI.deleteListingVideo(listingId, videoId);
    await invalidateCache(userId, { shopId, listingId });

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Delete Video API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}
