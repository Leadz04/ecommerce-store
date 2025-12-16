import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyListing, EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const etsyListingId = searchParams.get('etsyListingId');

    if (!etsyListingId) {
      return NextResponse.json(
        { success: false, error: 'etsyListingId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check DB first
    let listing = await EtsyListing.findOne({ etsyListingId }).lean();
    const needsRefresh = !listing || (listing.lastSyncedAt && 
      new Date().getTime() - new Date(listing.lastSyncedAt).getTime() > 6 * 60 * 60 * 1000);

    const shop = listing 
      ? await EtsyShop.findOne({ shopId: listing.shopId, isActive: true })
      : await EtsyShop.findOne({ isActive: true });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Etsy shop not found or inactive' },
        { status: 404 }
      );
    }

    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId, shop.refreshToken, async (newTokens) => {
      await EtsyShop.updateOne(
        { shopId: shop.shopId },
        {
          $set: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
          },
        }
      );
    });

    let etsyListing: any;
    if (needsRefresh) {
      // Fetch from API and update DB
      etsyListing = await etsyAPI.getListing(etsyListingId);
      
      // Update DB
      await EtsyListing.findOneAndUpdate(
        { etsyListingId },
        {
          $set: {
            userId: shop.userId,
            shopId: shop.shopId,
            etsyListingId,
            title: etsyListing.title,
            description: etsyListing.description,
            price: etsyListing.price.amount / etsyListing.price.divisor,
            currency: etsyListing.price.currency_code,
            state: etsyListing.state,
            tags: etsyListing.tags || [],
            materials: etsyListing.materials || [],
            categoryPath: etsyListing.category_path || [],
            inventory: { quantity: etsyListing.quantity || 0 },
            views: etsyListing.views || 0,
            numFavorers: etsyListing.num_favorers || 0,
            lastSyncedAt: new Date(),
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      // Re-fetch from DB
      listing = await EtsyListing.findOne({ etsyListingId }).lean();
    } else {
      // Use DB data, transform to match API format
      etsyListing = {
        listing_id: parseInt(etsyListingId),
        title: listing!.title,
        description: listing!.description,
        price: {
          amount: Math.round(listing!.price * 100),
          divisor: 100,
          currency_code: listing!.currency || 'USD',
        },
        state: listing!.state,
        quantity: listing!.inventory?.quantity || 0,
        views: listing!.views || 0,
        num_favorers: listing!.numFavorers || 0,
        tags: listing!.tags || [],
        materials: listing!.materials || [],
        category_path: listing!.categoryPath || [],
      };
    }

    return NextResponse.json({
      success: true,
      listing: etsyListing,
      localListing: listing,
    });
  } catch (error) {
    console.error('Error fetching Etsy listing details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing details' },
      { status: 500 }
    );
  }
}


