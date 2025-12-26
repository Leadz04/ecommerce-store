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
  try {
    const userId = await getCurrentUserId(request);
    const { listingId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get shopId from query params first, then from body
    let shopId = searchParams.get('shopId');
    let updateData: any = {};
    
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
            // Tags and materials can be comma-separated strings
            formData.append(key, value.join(','));
          } else if (key === 'image_ids') {
            // For image_ids, Etsy expects each ID as a separate entry with the same key
            // Format: image_ids=123&image_ids=456&image_ids=789
            // URLSearchParams handles multiple values correctly, but we need to ensure all are added
            console.log(`[Etsy Update API] Processing image_ids array:`, value);
            let addedCount = 0;
            const validIds: number[] = [];
            value.forEach((item) => {
              const id = typeof item === 'number' ? item : parseInt(String(item), 10);
              if (!isNaN(id) && id > 0) {
                formData.append(key, String(id));
                validIds.push(id);
                addedCount++;
                console.log(`[Etsy Update API] Added image_id: ${id}`);
              } else {
                console.warn(`[Etsy Update API] Skipped invalid image_id:`, item);
              }
            });
            console.log(`[Etsy Update API] Added ${addedCount} image_ids to form data:`, validIds);
            
            // Verify all image_ids are in formData
            const allImageIds = formData.getAll(key);
            console.log(`[Etsy Update API] Verified image_ids in formData:`, allImageIds);
            if (allImageIds.length !== validIds.length) {
              console.error(`[Etsy Update API] WARNING: Expected ${validIds.length} image_ids but formData has ${allImageIds.length}`);
            }
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

    // Log the final form data being sent - verify image_ids are included
    const imageIdsInFormData = formData.getAll('image_ids');
    console.log('[Etsy Update API] Image IDs retrieved from formData:', imageIdsInFormData);
    
    // Manually construct query string to ensure all image_ids are included
    // URLSearchParams.toString() should work, but let's verify and manually construct if needed
    let formDataString = formData.toString();
    
    // Verify all image_ids are in the string
    const imageIdMatches = formDataString.match(/image_ids=\d+/g);
    console.log('[Etsy Update API] Image IDs found in formData string:', imageIdMatches);
    
    // If image_ids are missing or incomplete, manually reconstruct
    if (imageIdsInFormData.length > 0) {
      const expectedImageIdParams = imageIdsInFormData.map(id => `image_ids=${id}`).join('&');
      const actualImageIdParams = imageIdMatches?.join('&') || '';
      
      if (expectedImageIdParams !== actualImageIdParams) {
        console.warn('[Etsy Update API] Image IDs mismatch detected. Reconstructing form data...');
        // Remove existing image_ids from string and add them manually
        formDataString = formDataString.replace(/image_ids=\d+&?/g, '');
        // Remove trailing & if present
        formDataString = formDataString.replace(/&$/, '');
        // Add all image_ids at the end
        if (formDataString) formDataString += '&';
        formDataString += expectedImageIdParams;
        console.log('[Etsy Update API] Reconstructed form data string with image_ids');
      }
    }
    
    console.log('[Etsy Update API] Final form data being sent:', formDataString.substring(0, 500) + (formDataString.length > 500 ? '...' : ''));
    console.log('[Etsy Update API] Form data length:', formDataString.length);
    
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
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to update listing' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

// Also support PUT for backwards compatibility
export const PUT = PATCH;
