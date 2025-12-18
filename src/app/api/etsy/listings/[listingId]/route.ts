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
    await etsyAPI['makeRequest'](`/application/shops/${shopId}/listings/${listingId}`, {
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
    const body = await request.json();
    const { shopId, ...updateData } = body;

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
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // For arrays, append each item with the key (Etsy expects comma-separated or multiple entries)
          if (key === 'tags' || key === 'materials') {
            // Tags and materials can be comma-separated strings
            formData.append(key, value.join(','));
          } else {
            // For other arrays like image_ids, append each item
            value.forEach((item) => formData.append(key, String(item)));
          }
        } else if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Update listing via Etsy API using PATCH method
    const updatedListing = await etsyAPI['makeRequest'](`/application/shops/${shopId}/listings/${listingId}`, {
      method: 'PATCH',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
