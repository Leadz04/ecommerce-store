import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL, invalidateCache } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/listings/[listingId]/images
 * Get images for a listing
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

    // Step 1: Check DB first (EtsyListing collection)
    const dbListing = await EtsyListing.findOne({ etsyListingId: listingId, userId }).lean();
    if (dbListing?.images && dbListing.images.length > 0) {
      const needsRefresh = !dbListing.lastSyncedAt ||
        (Date.now() - new Date(dbListing.lastSyncedAt).getTime()) > CACHE_TTL.LISTING_IMAGES;

      if (!needsRefresh) {
        console.log(`[DB HIT] Using images from database for listingId: ${listingId}`);
        // Return DB images
        const dbImages = dbListing.images.map((img: any) => ({
          listing_image_id: parseInt(img.listingImageId) || 0,
          url_fullxfull: img.url,
          url_570xN: img.url,
          url_75x75: img.url,
          url: img.url,
          rank: img.rank || 0,
        }));

        // Cache it
        const cacheKey = generateCacheKey('listing-images', { listingId });
        await setCachedData(cacheKey, userId, dbImages, CACHE_TTL.LISTING_IMAGES, shopId, listingId);

        return NextResponse.json({
          success: true,
          results: dbImages,
        });
      }
    }

    // Step 2: Check cache before API call
    const cacheKey = generateCacheKey('listing-images', { listingId });
    const cachedImages = await getCachedData<any[]>(cacheKey, userId);

    if (cachedImages) {
      console.log(`[Cache HIT] Using cached images for listingId: ${listingId}`);

      // Update DB with cached data
      if (dbListing) {
        await EtsyListing.findOneAndUpdate(
          { etsyListingId: listingId, userId },
          {
            $set: {
              images: cachedImages.map((img: any, idx: number) => ({
                url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
                rank: img.rank ?? idx,
                listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
              })),
              lastSyncedAt: new Date(),
            }
          }
        );
      }

      return NextResponse.json({
        success: true,
        results: cachedImages,
      });
    }

    // Step 3: Fetch from Etsy API only if not in DB or cache
    console.log(`[API Fetch] Fetching images from Etsy API for listingId: ${listingId}`);
    const images = await etsyAPI.getListingImages(listingId);

    // Save to cache
    await setCachedData(cacheKey, userId, images, CACHE_TTL.LISTING_IMAGES, shopId, listingId);

    // Update EtsyListing collection
    if (images && images.length > 0) {
      await EtsyListing.findOneAndUpdate(
        { etsyListingId: listingId, userId },
        {
          $set: {
            images: images.map((img: any, idx: number) => ({
              url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
              rank: img.rank ?? idx,
              listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
            })),
            lastSyncedAt: new Date(),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      results: images,
    });
  } catch (error: any) {
    console.error('[Etsy Listing Images API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch listing images'
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/etsy/listings/[listingId]/images
 * Upload a new image to a listing
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

    // Get form data from request
    const formData = await request.formData();

    // Upload image via Etsy API
    const result = await etsyAPI.uploadListingImage(listingId, formData);

    // Invalidate cache
    const cacheKey = generateCacheKey('listing-images', { listingId });
    await invalidateCache(userId, { shopId, listingId });

    // Refresh images from API and update DB
    const images = await etsyAPI.getListingImages(listingId);
    if (images && images.length > 0) {
      await EtsyListing.findOneAndUpdate(
        { etsyListingId: listingId, userId },
        {
          $set: {
            images: images.map((img: any, idx: number) => ({
              url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
              rank: img.rank ?? idx,
              listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
            })),
            lastSyncedAt: new Date(),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      result: result,
    });
  } catch (error: any) {
    console.error('[Etsy Upload Listing Image API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to upload listing image'
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/etsy/listings/[listingId]/images
 * Delete an image from a listing
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
    const imageId = searchParams.get('imageId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required as query parameter' }, { status: 400 });
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

    // Delete image via Etsy API
    await etsyAPI.deleteListingImage(listingId, imageId);

    // Invalidate cache
    await invalidateCache(userId, { shopId, listingId });

    // Refresh images from API and update DB
    const images = await etsyAPI.getListingImages(listingId);
    await EtsyListing.findOneAndUpdate(
      { etsyListingId: listingId, userId },
      {
        $set: {
          images: images.map((img: any, idx: number) => ({
            url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
            rank: img.rank ?? idx,
            listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
          })),
          lastSyncedAt: new Date(),
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Delete Listing Image API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to delete listing image'
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/etsy/listings/[listingId]/images
 * Update image rank/order
 */
export async function PATCH(
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

    const body = await request.json();
    const { imageId, rank, overwrite } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required in request body' }, { status: 400 });
    }

    if (!rank || rank < 1) {
      return NextResponse.json({ error: 'Valid rank (>= 1) is required' }, { status: 400 });
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

    // Update image rank via Etsy API
    const result = await etsyAPI.updateListingImageRank(listingId, imageId, rank, overwrite ?? true);

    // Invalidate cache
    await invalidateCache(userId, { shopId, listingId });

    // Refresh images from API and update DB
    const images = await etsyAPI.getListingImages(listingId);
    if (images && images.length > 0) {
      await EtsyListing.findOneAndUpdate(
        { etsyListingId: listingId, userId },
        {
          $set: {
            images: images.map((img: any, idx: number) => ({
              url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
              rank: img.rank ?? idx,
              listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
            })),
            lastSyncedAt: new Date(),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      result: result,
    });
  } catch (error: any) {
    console.error('[Etsy Update Listing Image Rank API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to update listing image rank'
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
