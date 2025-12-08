import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyListing, EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { isEtsyDataFresh, needsEtsyDataRefresh } from '@/lib/etsy-compliance';

/**
 * GET /api/etsy/listings
 * 
 * Get Etsy listings with freshness validation per API Terms:
 * - Listing content must not be displayed if older than 6 hours
 * - Automatically refreshes stale data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    await connectDB();

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    // Get cached listings
    let listings = await EtsyListing.find({ shopId }).sort({ lastSyncedAt: -1 });

    // Check if data needs refresh (per Etsy API Terms - 6 hours for listings)
    const needsRefresh = forceRefresh || listings.some(listing => 
      needsEtsyDataRefresh(listing.lastSyncedAt, 'listing')
    );

    if (needsRefresh) {
      // Refresh listings from Etsy API
      const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId);
      const freshListings = await etsyAPI.getListings(shopId);

      // Update database with fresh data
      for (const listing of freshListings) {
        const listingData = {
          etsyListingId: listing.listing_id.toString(),
          shopId: shop.shopId,
          title: listing.title,
          description: listing.description,
          price: listing.price.amount / listing.price.divisor,
          currency: listing.price.currency_code,
          state: listing.state,
          tags: listing.tags,
          materials: listing.materials,
          categoryPath: listing.category_path,
          inventory: {
            quantity: listing.quantity,
          },
          lastSyncedAt: new Date(),
        };

        await EtsyListing.findOneAndUpdate(
          { etsyListingId: listing.listing_id.toString() },
          listingData,
          { upsert: true, new: true }
        );
      }

      // Get updated listings
      listings = await EtsyListing.find({ shopId }).sort({ lastSyncedAt: -1 });
    }

    // Filter out stale listings that couldn't be refreshed
    const freshListings = listings.filter(listing => 
      isEtsyDataFresh(listing.lastSyncedAt, 'listing')
    );

    return NextResponse.json({
      success: true,
      listings: freshListings,
      refreshed: needsRefresh,
      total: freshListings.length,
    });

  } catch (error) {
    console.error('Error fetching Etsy listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
