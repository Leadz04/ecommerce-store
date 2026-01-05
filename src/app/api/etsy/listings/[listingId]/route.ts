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

    // Convert update data to form-urlencoded format
    // Handle arrays properly (tags, materials, image_ids, etc.)
    const formData = new URLSearchParams();

    // Log the update data for debugging
    console.log('[Etsy Update API] Received update data keys:', Object.keys(updateData));
    console.log('[Etsy Update API] Update data sample:', {
      title: updateData.title,
      description: updateData.description ? `${updateData.description.substring(0, 50)}...` : '(empty)',
      price: updateData.price,
      quantity: updateData.quantity,
      image_ids_count: Array.isArray(updateData.image_ids) ? updateData.image_ids.length : 0,
      tags_count: Array.isArray(updateData.tags) ? updateData.tags.length : 0,
    });

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // For arrays, append each item with the key (Etsy expects comma-separated or multiple entries)
          if (key === 'tags' || key === 'materials') {
            // Validate and clean tags/materials
            // Etsy V3 regex constraints:
            // Tags: [^\p{L}\p{Nd}\p{Zs}\-'\u2122\u00a9\u00ae] (letters, numbers, space, -, ', ™, ©, ®)
            // Materials: [^\p{L}\p{Nd}\p{Zs}] (letters, numbers, space only)
            const cleanedItems = value
              .filter(item => item !== null && item !== undefined && String(item).trim() !== '')
              .map(item => {
                let s = String(item).trim();
                if (key === 'materials') {
                  // Materials are very strict: only letters, numbers, and whitespace characters
                  // Remove anything that isn't a letter, digit, or whitespace
                  s = s.replace(/[^\p{L}\p{Nd}\p{Zs}]/gu, '');
                } else {
                  // Tags allow a few more characters
                  s = s.replace(/[^\p{L}\p{Nd}\p{Zs}\-'\u2122\u00a9\u00ae]/gu, '');
                }
                return s;
              })
              .filter(s => s.length > 0);

            if (cleanedItems.length === 0) {
              console.warn(`[Etsy Update API] Empty ${key} array after cleaning, skipping`);
              return; // Skip empty arrays
            }

            // Tags and materials can be comma-separated strings
            const tagsString = cleanedItems.join(',');
            console.log(`[Etsy Update API] Processing ${key}:`, { original: value, cleaned: cleanedItems, string: tagsString });
            formData.append(key, tagsString);
          } else if (key === 'image_ids') {
            console.log(`[Etsy Update API] Processing image_ids array:`, value);
            const validIds = value
              .map((item: any) => (typeof item === 'number' ? item : parseInt(String(item), 10)))
              .filter((id: number) => !isNaN(id) && id > 0);

            if (validIds.length > 0) {
              const imageIdsString = validIds.join(',');
              formData.append(key, imageIdsString);
              console.log(`[Etsy Update API] Joined and added image_ids: ${imageIdsString}`);
            } else {
              console.warn(`[Etsy Update API] No valid image IDs found in array`, value);
            }
          } else if (key === 'styles' || key === 'style') {
            value.forEach((item: any) => formData.append('styles[]', String(item)));
          } else {
            // For other arrays, append each item
            value.forEach((item) => formData.append(key, String(item)));
          }
        } else if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Use URLSearchParams to generate the correctly encoded form data string
    const formDataString = formData.toString();
    console.log('[Etsy Update API] Final encoded form data string length:', formDataString.length);
    console.log('[Etsy Update API] Sample of data being sent:', formDataString.substring(0, 500) + (formDataString.length > 500 ? '...' : ''));

    // Verify listing exists and belongs to this shop before updating
    try {
      const existingListing = await etsyAPI.getListing(listingId);
      if (!existingListing || existingListing.listing_id?.toString() !== listingId) {
        return NextResponse.json(
          {
            success: false,
            error: `Listing ${listingId} not found or does not belong to shop ${shopId}`
          },
          { status: 404 }
        );
      }
      console.log('[Etsy Update API] Verified listing exists:', {
        listing_id: existingListing.listing_id,
        title: existingListing.title,
        state: existingListing.state,
      });
    } catch (verifyError: any) {
      // If listing doesn't exist, return a clear error
      if (verifyError?.message?.includes('404') || verifyError?.message?.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: `Listing ${listingId} not found on Etsy. Please verify the listing ID and that it belongs to shop ${shopId}.`
          },
          { status: 404 }
        );
      }
      // For other errors during verification, log but continue (might be a temporary issue)
      console.warn('[Etsy Update API] Could not verify listing before update:', verifyError);
    }

    // Update listing via Etsy API using PATCH method
    const updatedListing = await etsyAPI['makeRequest'](`/application/shops/${shopId}/listings/${listingId}`, {
      method: 'PATCH',
      body: formDataString,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Log the response to see if images were updated
    console.log('[Etsy Update API] Update response - checking images:', {
      listing_id: updatedListing.listing_id,
      has_images: !!updatedListing.images,
      images_count: updatedListing.images?.length || 0,
      image_ids: updatedListing.images?.map((img: any) => img.listing_image_id) || [],
    });

    console.log('[Etsy Update API] Update successful, response:', {
      listing_id: updatedListing.listing_id,
      title: updatedListing.title,
      state: updatedListing.state,
    });

    // Update DB
    const etsyListingId = listingId;
    await EtsyListing.findOneAndUpdate(
      { etsyListingId, userId },
      {
        $set: {
          title: updatedListing.title || updateData.title,
          description: updatedListing.description || updateData.description,
          price: updatedListing.price?.amount ? updatedListing.price.amount / updatedListing.price.divisor : 0,
          currency: updatedListing.price?.currency_code || 'USD',
          state: updatedListing.state || updateData.state,
          tags: updatedListing.tags || updateData.tags || [],
          materials: updatedListing.materials || updateData.materials || [],
          inventory: { quantity: updatedListing.quantity || updateData.quantity || 0 },
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
