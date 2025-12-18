import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/listings/[listingId]/details
 * Get full details for a single listing
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
    let listing = await EtsyListing.findOne({ etsyListingId: listingId, userId }).lean();
    
    // Check if data needs refresh (6 hours for listings)
    const needsRefresh = !listing || 
      !listing.lastSyncedAt || 
      (Date.now() - new Date(listing.lastSyncedAt).getTime()) > CACHE_TTL.LISTING;
    
    if (!needsRefresh && listing) {
      // Use DB data - transform to API format
      console.log(`[DB HIT] Using listing details from database for listingId: ${listingId}`);
      const dbListingData = {
        listing_id: parseInt(listingId),
        title: listing.title,
        description: listing.description,
        tags: listing.tags || [],
        materials: listing.materials || [],
        category_path: listing.categoryPath || [],
        price: {
          amount: Math.round((listing.price || 0) * 100),
          divisor: 100,
          currency_code: listing.currency || 'USD',
        },
        quantity: listing.inventory?.quantity || 0,
        state: listing.state,
        views: listing.views || 0,
        num_favorers: listing.numFavorers || 0,
      };
      
      return NextResponse.json({
        success: true,
        listing: dbListingData,
      });
    }
    
    // Step 2: Check cache before API call
    const cacheKey = generateCacheKey('listing-details', { listingId });
    const cachedListing = await getCachedData<any>(cacheKey, userId);
    
    if (cachedListing) {
      console.log(`[Cache HIT] Using cached listing details for listingId: ${listingId}`);
      
      // Update DB with cached data for consistency
      await EtsyListing.findOneAndUpdate(
        { etsyListingId: listingId, userId },
        {
          $set: {
            userId,
            etsyListingId: listingId,
            shopId,
            title: cachedListing.title,
            description: cachedListing.description,
            price: cachedListing.price?.amount ? cachedListing.price.amount / cachedListing.price.divisor : 0,
            currency: cachedListing.price?.currency_code || 'USD',
            state: cachedListing.state,
            tags: cachedListing.tags || [],
            materials: cachedListing.materials || [],
            categoryPath: cachedListing.category_path || [],
            inventory: { quantity: cachedListing.quantity || 0 },
            views: cachedListing.views || 0,
            numFavorers: cachedListing.num_favorers || 0,
            lastSyncedAt: new Date(),
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      return NextResponse.json({
        success: true,
        listing: cachedListing,
      });
    }
    
    // Step 3: Fetch from Etsy API only if not in DB or cache
    console.log(`[API Fetch] Fetching listing details from Etsy API for listingId: ${listingId}`);
    const apiListing = await etsyAPI.getListing(listingId);
    
    // Save to DB
    await EtsyListing.findOneAndUpdate(
      { etsyListingId: listingId, userId },
      {
        $set: {
          userId,
          etsyListingId: listingId,
          shopId,
          title: apiListing.title,
          description: apiListing.description,
          price: apiListing.price?.amount ? apiListing.price.amount / apiListing.price.divisor : 0,
          currency: apiListing.price?.currency_code || 'USD',
          state: apiListing.state,
          tags: apiListing.tags || [],
          materials: apiListing.materials || [],
          categoryPath: apiListing.category_path || [],
          inventory: { quantity: apiListing.quantity || 0 },
          views: apiListing.views || 0,
          numFavorers: apiListing.num_favorers || 0,
          lastSyncedAt: new Date(),
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    // Cache the raw API response (contains ALL fields from Etsy)
    await setCachedData(cacheKey, userId, apiListing, CACHE_TTL.LISTING, shopId, listingId);
    
    return NextResponse.json({
      success: true,
      listing: apiListing,
    });
  } catch (error: any) {
    console.error('[Etsy Listing Details API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch listing details' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
