import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/listings/[listingId]/inventory
 * Get inventory (products/variations) for a listing
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
    
    if (dbListing?.inventory && dbListing.inventory.products && dbListing.inventory.products.length > 0) {
      const needsRefresh = !dbListing.lastSyncedAt || 
        (Date.now() - new Date(dbListing.lastSyncedAt).getTime()) > CACHE_TTL.LISTING_INVENTORY;
      
      if (!needsRefresh) {
        console.log(`[DB HIT] Using inventory from database for listingId: ${listingId}`);
        return NextResponse.json({
          success: true,
          inventory: dbListing.inventory,
        });
      }
    }
    
    // Step 2: Check cache before API call
    const cacheKey = generateCacheKey('listing-inventory', { listingId });
    const cachedInventory = await getCachedData<any>(cacheKey, userId);
    
    if (cachedInventory) {
      console.log(`[Cache HIT] Using cached inventory for listingId: ${listingId}`);
      
      // Update DB with cached data
      if (dbListing) {
        await EtsyListing.findOneAndUpdate(
          { etsyListingId: listingId, userId },
          {
            $set: {
              inventory: cachedInventory,
              lastSyncedAt: new Date(),
            }
          }
        );
      }
      
      return NextResponse.json({
        success: true,
        inventory: cachedInventory,
      });
    }
    
    // Step 3: Fetch from Etsy API only if not in DB or cache
    console.log(`[API Fetch] Fetching inventory from Etsy API for listingId: ${listingId}`);
    const inventory = await etsyAPI.getListingInventory(listingId);
    
    // Save to cache
    await setCachedData(cacheKey, userId, inventory, CACHE_TTL.LISTING_INVENTORY, shopId, listingId);
    
    // Update DB
    if (dbListing) {
      await EtsyListing.findOneAndUpdate(
        { etsyListingId: listingId, userId },
        {
          $set: {
            inventory: inventory,
            lastSyncedAt: new Date(),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      inventory,
    });
  } catch (error: any) {
    console.error('[Etsy Listing Inventory API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch listing inventory' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
