import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL, invalidateCache } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/listings
 * Get shop listings - matches Business Suite component expectations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'active';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

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

    // Invalidate cache if force refresh requested
    if (forceRefresh) {
      await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-listings' });
    }

    // Check cache first (unless forcing refresh)
    const cacheKey = generateCacheKey('shop-listings', { shopId, state, limit, offset });
    const cachedData = await getCachedData<any>(cacheKey, userId);
    
    let listings: any[] = [];
    let totalCount = 0;
    let hasMore = false;
    
    if (cachedData && !forceRefresh) {
      // Return cached data
      console.log(`[Cache HIT] Listings for shopId: ${shopId}, state: ${state}`);
      listings = cachedData.results || [];
      totalCount = cachedData.total || listings.length;
      hasMore = cachedData.hasMore || false;
    } else {
      // Fetch from Etsy API
      console.log(`[Cache MISS] Fetching listings from Etsy API for shopId: ${shopId}, state: ${state}`);
      const requestLimit = Math.min(limit, 100);
      
      // Use different endpoints based on state
      let endpoint = `/application/shops/${shopId}/listings/active`;
      if (state === 'draft') {
        // For draft listings, we need to fetch all and filter, or use a different approach
        // Etsy API doesn't have a dedicated draft endpoint, so we'll fetch from DB or use active endpoint with filtering
        endpoint = `/application/shops/${shopId}/listings/active`;
      } else if (state === 'inactive') {
        // Similar for inactive - may need to fetch all and filter by state
        endpoint = `/application/shops/${shopId}/listings/active`;
      }
      
      const response = await etsyAPI['makeRequest'](
        `${endpoint}?limit=${requestLimit}&offset=${offset}`
      );
      
      // Filter by state if needed (since Etsy API only has /active endpoint)
      let filteredListings = response.results || [];
      if (state !== 'active') {
        // For draft/inactive, fetch from DB (Etsy API doesn't have dedicated endpoints)
        const dbListings = await EtsyListing.find({
          userId,
          shopId,
          state: state
        })
        .sort({ lastSyncedAt: -1 })
        .limit(requestLimit)
        .skip(offset)
        .lean();
        
        if (dbListings && dbListings.length > 0) {
          // Transform DB listings to match API format
          filteredListings = dbListings.map((db: any) => ({
            listing_id: parseInt(db.etsyListingId),
            listingId: parseInt(db.etsyListingId),
            user_id: db.userId,
            shop_id: parseInt(shopId),
            title: db.title,
            description: db.description,
            state: db.state,
            price: {
              amount: Math.round((db.price || 0) * 100),
              divisor: 100,
              currency_code: db.currency || 'USD',
              currencyCode: db.currency || 'USD'
            },
            quantity: db.inventory?.quantity || 0,
            tags: db.tags || [],
            materials: db.materials || [],
            category_path: db.categoryPath || [],
            taxonomy_id: db.taxonomyId,
            views: db.views || 0,
            num_favorers: db.numFavorers || 0,
            url: `https://www.etsy.com/listing/${db.etsyListingId}`,
            shipping_profile_id: db.shippingProfileId,
            shop_section_id: db.shopSectionId,
            processing_min: db.processingMin,
            processing_max: db.processingMax,
            who_made: db.whoMade,
            when_made: db.whenMade,
            is_supply: db.isSupply,
            is_digital: db.isDigital,
            has_variations: db.hasVariations,
            should_auto_renew: db.shouldAutoRenew,
            language: db.language,
            creation_timestamp: db.createdAt ? Math.floor(new Date(db.createdAt).getTime() / 1000) : 0,
            created_timestamp: db.createdAt ? Math.floor(new Date(db.createdAt).getTime() / 1000) : 0,
            last_modified_timestamp: db.updatedAt ? Math.floor(new Date(db.updatedAt).getTime() / 1000) : 0,
            updated_timestamp: db.updatedAt ? Math.floor(new Date(db.updatedAt).getTime() / 1000) : 0,
            state_timestamp: db.stateTimestamp ? Math.floor(new Date(db.stateTimestamp).getTime() / 1000) : 0,
          }));
        } else {
          // If not in DB, return empty array (draft/inactive listings may not be synced yet)
          filteredListings = [];
        }
      }
      
      // For active listings, save to DB
      if (state === 'active') {
        for (const listing of filteredListings) {
          try {
            const etsyListingId = listing.listing_id.toString();
            await EtsyListing.findOneAndUpdate(
              { etsyListingId, userId },
              {
                $set: {
                  userId,
                  etsyListingId,
                  shopId,
                  title: listing.title,
                  description: listing.description,
                  price: listing.price?.amount ? listing.price.amount / listing.price.divisor : 0,
                  currency: listing.price?.currency_code || 'USD',
                  state: listing.state,
                  tags: listing.tags || [],
                  materials: listing.materials || [],
                  categoryPath: listing.category_path || [],
                  inventory: { quantity: listing.quantity || 0 },
                  views: listing.views || 0,
                  numFavorers: listing.num_favorers || 0,
                  lastSyncedAt: new Date(),
                }
              },
              { upsert: true, new: true }
            );
          } catch (err) {
            console.warn(`Failed to save listing ${listing.listing_id} to DB:`, err);
          }
        }
      }
      
      listings = filteredListings;
      totalCount = state !== 'active' && filteredListings.length < requestLimit 
        ? filteredListings.length 
        : (response.count || filteredListings.length);
      hasMore = filteredListings.length === requestLimit && (offset + filteredListings.length) < totalCount;
      
      // Cache the response
      await setCachedData(
        cacheKey,
        userId,
        { results: listings, total: totalCount, hasMore },
        CACHE_TTL.LISTING,
        shopId
      );
    }

    // Transform listings to match component expectations
    const transformedListings = listings.map((listing: any) => ({
      listingId: listing.listing_id || listing.listingId,
      userId: listing.user_id || listing.userId,
      shopSectionId: listing.shop_section_id || listing.shopSectionId,
      title: listing.title,
      description: listing.description,
      state: listing.state,
      creationTimestamp: listing.creation_timestamp,
      createdTimestamp: listing.created_timestamp,
      endingTimestamp: listing.ending_timestamp,
      originalCreationTimestamp: listing.original_creation_timestamp,
      lastModifiedTimestamp: listing.last_modified_timestamp,
      updatedTimestamp: listing.updated_timestamp,
      stateTimestamp: listing.state_timestamp,
      quantity: listing.quantity,
      shopSectionId2: listing.shop_section_id_2,
      featuredRank: listing.featured_rank,
      url: listing.url,
      views: listing.views,
      numFavorers: listing.num_favorers,
      shippingProfileId: listing.shipping_profile_id,
      processingMin: listing.processing_min,
      processingMax: listing.processing_max,
      whoMade: listing.who_made,
      whenMade: listing.when_made,
      isSupply: listing.is_supply,
      itemWeight: listing.item_weight,
      itemLength: listing.item_length,
      itemWidth: listing.item_width,
      itemHeight: listing.item_height,
      itemWeightUnit: listing.item_weight_unit,
      itemDimensionsUnit: listing.item_dimensions_unit,
      isPersonalizable: listing.is_personalizable,
      personalizationIsRequired: listing.personalization_is_required,
      personalizationCharCountMax: listing.personalization_char_count_max,
      personalizationInstructions: listing.personalization_instructions,
      isCustomizable: listing.is_customizable,
      isDigital: listing.is_digital,
      fileData: listing.file_data,
      hasVariations: listing.has_variations,
      shouldAutoRenew: listing.should_auto_renew,
      language: listing.language,
      price: listing.price?.amount !== undefined ? {
        amount: listing.price.amount || 0,
        currencyCode: listing.price.currency_code || listing.price.currencyCode || 'USD',
      } : (listing.price || { amount: 0, currencyCode: 'USD' }),
      taxonomyId: listing.taxonomy_id,
      tags: listing.tags || [],
      materials: listing.materials || [],
      shopSectionId3: listing.shop_section_id_3,
      style: listing.style || [],
      images: listing.images || [],
      shopId: listing.shop_id || listing.shopId || shopId,
      productionPartnerIds: listing.production_partner_ids || listing.productionPartnerIds,
      taxonomyPath: listing.taxonomy_path || listing.taxonomyPath,
      taxonomyIds: listing.taxonomy_ids || listing.taxonomyIds,
    }));

    return NextResponse.json({
      success: true,
      results: transformedListings,
      count: transformedListings.length,
      total: totalCount,
      hasMore: hasMore,
      offset: offset + transformedListings.length,
    });
  } catch (error: any) {
    console.error('[Etsy Shop Listings API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch listings' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
