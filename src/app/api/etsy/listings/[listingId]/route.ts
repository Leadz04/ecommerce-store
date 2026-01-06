import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { invalidateCache } from '@/lib/etsy-cache';

/**
 * DELETE /api/etsy/listings/[listingId]
 * Delete a listing
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

    // Delete listing via Etsy API
    // According to Etsy OpenAPI spec, delete endpoint is /application/listings/{listing_id} (without shop_id)
    await etsyAPI['makeRequest'](`/application/listings/${listingId}`, {
      method: 'DELETE',
    });

    // Remove from DB
    await EtsyListing.deleteOne({ etsyListingId: listingId, userId });

    // Invalidate all caches related to this listing
    await invalidateCache(userId, { shopId, listingId });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Delete Listing API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to delete listing'
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/etsy/listings/[listingId]
 * Update a listing (Etsy uses PATCH method)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const { searchParams } = new URL(request.url);
  let shopId = searchParams.get('shopId');
  let updateData: any = {};

  try {
    const userId = await getCurrentUserId(request);

    try {
      const body = await request.json();
      if (body.shopId && !shopId) {
        shopId = body.shopId;
      }
      // Extract updateData, excluding shopId
      const { shopId: bodyShopId, ...rest } = body;
      updateData = rest;
    } catch (e) {
      // Body might be empty or invalid JSON, that's okay
      console.warn('[Etsy Update API] Could not parse request body:', e);
    }

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

    // Update listing via Etsy API using the class method which handles normalization
    const updatedListing = await etsyAPI.updateListing(listingId, updateData);
    // Cast to any for easier access to properties not strictly in EtsyListingData interface
    const updated: any = updatedListing;

    // Log the response to see if images were updated
    console.log('[Etsy Update API] Update response - checking images:', {
      listing_id: updated.listing_id,
      has_images: !!updated.images,
      images_count: updated.images?.length || 0,
      image_ids: updated.images?.map((img: any) => img.listing_image_id) || [],
    });

    console.log('[Etsy Update API] Update successful, response:', {
      listing_id: updated.listing_id,
      title: updated.title,
      state: updated.state,
    });

    // Extract numerical price from Etsy response structure
    const getPriceValue = (price: any): number => {
      if (!price) return 0;
      if (typeof price === 'object' && price.amount !== undefined) {
        return price.amount / (price.divisor || 100);
      }
      return Number(price);
    };

    const getCurrencyCode = (price: any): string => {
      if (typeof price === 'object' && price.currency_code) {
        return price.currency_code;
      }
      return 'USD';
    };

    // Update DB
    const etsyListingId = listingId;
    await EtsyListing.findOneAndUpdate(
      { etsyListingId, userId },
      {
        $set: {
          title: updated.title || updateData.title,
          description: updated.description || updateData.description,
          price: getPriceValue(updated.price),
          currency: getCurrencyCode(updated.price),
          state: updated.state || updateData.state,
          tags: updated.tags || updateData.tags || [],
          materials: updated.materials || updateData.materials || [],
          inventory: { quantity: updated.quantity || updateData.quantity || 0 },
          lastSyncedAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    // Invalidate all caches related to this listing
    await invalidateCache(userId, { shopId, listingId });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error: any) {
    console.error('[Etsy Update Listing API] Error:', error);

    // Parse Etsy API error messages more clearly
    let errorMessage = error?.message || 'Failed to update listing';
    let statusCode = 500;

    // Check for specific error types
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      errorMessage = `Listing ${listingId} not found on Etsy. Please verify the listing ID and that it belongs to shop ${shopId}.`;
      statusCode = 404;
    } else if (error?.message?.includes('authentication') || error?.message?.includes('401')) {
      errorMessage = 'Etsy API authentication failed. Please reconnect your shop.';
      statusCode = 401;
    } else if (error?.message?.includes('403') || error?.message?.includes('forbidden')) {
      errorMessage = `You don't have permission to update this listing. Please verify the listing belongs to shop ${shopId}.`;
      statusCode = 403;
    } else if (error?.message?.includes('400') || error?.message?.includes('bad request')) {
      // Try to extract more details from the error
      const errorDetails = error?.message?.match(/\{.*\}/)?.[0];
      if (errorDetails) {
        try {
          const parsed = JSON.parse(errorDetails);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } catch (e) {
          // Keep original message if parsing fails
        }
      }
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: statusCode }
    );
  }
}

// Also support PUT for backwards compatibility
export const PUT = PATCH;
