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

    // Step 1: Check cache first (contains full API response with ALL fields)
    const cacheKey = generateCacheKey('listing-details', { listingId });
    const cachedListing = await getCachedData<any>(cacheKey, userId);
    
    if (cachedListing) {
      console.log(`[Cache HIT] Using cached listing details for listingId: ${listingId}`);
      // Return cached data directly - it has ALL fields from Etsy API
      return NextResponse.json({
        success: true,
        listing: cachedListing,
      });
    }
    
    // Step 2: Check DB (but prefer fresh API data for editing)
    let listing = await EtsyListing.findOne({ etsyListingId: listingId, userId }).lean();
    
    // Check if data needs refresh (6 hours for listings)
    const needsRefresh = !listing || 
      !listing.lastSyncedAt || 
      (Date.now() - new Date(listing.lastSyncedAt).getTime()) > CACHE_TTL.LISTING;
    
    if (!needsRefresh && listing) {
      // Use DB data - but we'll still fetch from API to get ALL fields
      // This ensures we have complete data for editing
      console.log(`[DB HIT] Found listing in DB, but fetching fresh from API for complete data`);
    }
    
    // Step 3: Always fetch from Etsy API to ensure we have ALL fields
    console.log(`[API Fetch] Fetching listing details from Etsy API for listingId: ${listingId}`);
    const apiListing = await etsyAPI.getListing(listingId);
    
    // Save to DB - include ALL fields from Etsy API
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
          // Include ALL other fields from API response
          taxonomyId: apiListing.taxonomy_id,
          whoMade: apiListing.who_made,
          whenMade: apiListing.when_made,
          isSupply: apiListing.is_supply,
          shippingProfileId: apiListing.shipping_profile_id,
          shopSectionId: apiListing.shop_section_id,
          returnPolicyId: apiListing.return_policy_id,
          itemWeight: apiListing.item_weight,
          itemWeightUnit: apiListing.item_weight_unit,
          itemLength: apiListing.item_length,
          itemWidth: apiListing.item_width,
          itemHeight: apiListing.item_height,
          itemDimensionsUnit: apiListing.item_dimensions_unit,
          processingMin: apiListing.processing_min,
          processingMax: apiListing.processing_max,
          isTaxable: apiListing.is_taxable,
          isPersonalizable: apiListing.is_personalizable,
          personalizationIsRequired: apiListing.personalization_is_required,
          personalizationCharCountMax: apiListing.personalization_char_count_max,
          personalizationInstructions: apiListing.personalization_instructions,
          shouldAutoRenew: apiListing.should_auto_renew,
          featuredRank: apiListing.featured_rank,
          type: apiListing.type,
          isDigital: apiListing.is_digital,
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
