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

  try {
    const userId = await getCurrentUserId(request);
    let listingPayload: any = {};
    let productImages: string[] = [];

    try {
      const body = await request.json();
      shopId = shopId || body.shopId;

      // The frontend sends { shopId, listing, productImages }
      // We want to update with the contents of 'listing'
      listingPayload = body.listing || body;
      productImages = body.productImages || [];

      // Clean up metadata (remove non-Etsy fields if any)
      delete (listingPayload as any).shopId;
    } catch (e) {
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

    // 1. Update listing metadata via Etsy API
    console.log(`[Etsy Update API] Updating metadata for listing ${listingId}...`);
    const updatedListing = await etsyAPI.updateListing(listingId, listingPayload);
    const updated: any = updatedListing;

    // 2. Handle Images if provided
    const finalUploadedImages: any[] = [];
    if (productImages && Array.isArray(productImages) && productImages.length > 0) {
      console.log(`[Etsy Update API] Handling ${productImages.length} images for listing ${listingId}...`);

      try {
        // Helper to download image
        const downloadImage = async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const filename = url.split('/').pop()?.split('?')[0] || 'image.jpg';
          return { buffer, filename };
        };

        for (let i = 0; i < Math.min(productImages.length, 10); i++) {
          const imageUrl = productImages[i];
          if (!imageUrl || typeof imageUrl !== 'string') continue;

          try {
            const { buffer, filename } = await downloadImage(imageUrl);
            const formData = new FormData();
            const file = new File([buffer as any], filename, { type: 'image/jpeg' });
            formData.append('image', file);
            formData.append('rank', (i + 1).toString());

            const uploadedImg = await etsyAPI.uploadListingImage(listingId, formData);
            finalUploadedImages.push(uploadedImg);

            // Wait slightly between uploads
            await new Promise(r => setTimeout(r, 400));
          } catch (imgErr) {
            console.error(`[Etsy Update API] Failed to upload image ${i}:`, imgErr);
          }
        }
      } catch (imageErr) {
        console.error('[Etsy Update API] Error in image processing:', imageErr);
      }
    }

    // Helper to extract numerical price
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

    // 3. Update local DB to stay in sync
    await EtsyListing.findOneAndUpdate(
      { etsyListingId: listingId, userId },
      {
        $set: {
          title: updated.title || listingPayload.title,
          description: updated.description || listingPayload.description,
          price: getPriceValue(updated.price || listingPayload.price),
          currency: getCurrencyCode(updated.price || listingPayload.price),
          state: updated.state || listingPayload.state,
          tags: updated.tags || listingPayload.tags || [],
          materials: updated.materials || listingPayload.materials || [],
          inventory: { quantity: updated.quantity || listingPayload.quantity || 0 },
          ...(finalUploadedImages.length > 0 ? {
            images: finalUploadedImages.map((img, idx) => ({
              url: img.url_fullxfull || img.url_570xN || img.url,
              rank: img.rank || idx + 1,
              listingImageId: img.listing_image_id?.toString()
            }))
          } : {}),
          lastSyncedAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    await invalidateCache(userId, { shopId, listingId });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error: any) {
    console.error('[Etsy Update Listing API] Error:', error);
    let errorMessage = error?.message || 'Failed to update listing';
    let statusCode = 500;

    if (error?.message?.includes('404')) {
      errorMessage = 'Listing not found on Etsy.';
      statusCode = 404;
    } else if (error?.message?.includes('401')) {
      errorMessage = 'Authentication failed.';
      statusCode = 401;
    } else if (error?.message?.includes('400')) {
      statusCode = 400;
      try {
        const details = JSON.parse(error.message.match(/\{.*\}/)?.[0] || '{}');
        errorMessage = details.error || details.message || errorMessage;
      } catch (e) { }
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
  }
}

export const PUT = PATCH;
