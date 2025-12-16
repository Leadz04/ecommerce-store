import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const includeStale = searchParams.get('includeStale') === 'true';

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

    // Build query for listings
    const query: any = { shopId };
    if (userId) {
      query.userId = userId;
    }

    // Fetch listings from database
    let dbListings = await EtsyListing.find(query)
      .sort({ lastSyncedAt: -1 })
      .lean();

    // Check if we need to refresh from Etsy API
    let refreshed = false;
    const needsRefresh = forceRefresh || dbListings.some(listing => 
      needsEtsyDataRefresh(listing.lastSyncedAt, 'listing')
    );

    if (needsRefresh && !includeStale) {
      // Sync from Etsy API if data is stale or force refresh requested
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

      const etsyListings = await etsyAPI.getListings(shopId);
      
      // Update database with fresh data
      for (const listing of etsyListings) {
        const etsyListingId = listing.listing_id.toString();
        
        // Fetch images for the listing
        let images: Array<{ url: string; rank: number; listingImageId: string }> = [];
        try {
          const listingImages = await etsyAPI.getListingImages(etsyListingId);
          images = listingImages.map((img: any, index: number) => ({
            url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
            rank: img.rank ?? index,
            listingImageId: img.listing_image_id?.toString() || `${etsyListingId}-${index}`,
          })).filter((img: any) => img.url); // Filter out images without URLs
        } catch (error) {
          console.warn(`Failed to fetch images for listing ${etsyListingId}:`, error);
        }
        
        const listingData = {
          userId,
          etsyListingId,
          shopId: shop.shopId,
          title: listing.title,
          description: listing.description,
          price: listing.price.amount / listing.price.divisor,
          currency: listing.price.currency_code,
          state: listing.state,
          tags: listing.tags,
          materials: listing.materials,
          categoryPath: listing.category_path,
          images,
          inventory: {
            quantity: listing.quantity,
          },
          views: (listing as any).views ?? 0,
          numFavorers: (listing as any).num_favorers ?? 0,
          lastSyncedAt: new Date(),
        };

        await EtsyListing.findOneAndUpdate(
          { etsyListingId },
          { $set: listingData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      refreshed = true;
      
      // Re-fetch from database after sync
      dbListings = await EtsyListing.find(query)
        .sort({ lastSyncedAt: -1 })
        .lean();
    }

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string | undefined | null): string => {
      if (!text) return '';
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };

    // Transform database listings to match expected format
    const listings = dbListings.map(listing => ({
      _id: listing._id?.toString(),
      etsyListingId: listing.etsyListingId,
      listing_id: parseInt(listing.etsyListingId),
      title: decodeHtmlEntities(listing.title),
      description: decodeHtmlEntities(listing.description),
      tags: (listing.tags || []).map((tag: string) => decodeHtmlEntities(tag)),
      price: listing.price, // Already a number from database
      currency: listing.currency || 'USD',
      quantity: listing.inventory?.quantity ?? 0,
      inventory: {
        quantity: listing.inventory?.quantity ?? 0,
      },
      images: listing.images || [],
      views: listing.views ?? 0,
      num_favorers: listing.numFavorers ?? 0,
      state: listing.state,
      lastSyncedAt: listing.lastSyncedAt,
    }));

    return NextResponse.json({
      success: true,
      listings,
      refreshed,
    });
  } catch (error: any) {
    console.error('[Etsy Listings API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
