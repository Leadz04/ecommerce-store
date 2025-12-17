import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';

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

    // Get listings from Etsy API with pagination
    // Etsy API supports limit (max 100) and offset for pagination
    // Use the requested limit directly (max 100 per Etsy API)
    const requestLimit = Math.min(limit, 100);
    
    // Make a single API call with the requested limit and offset
    const response = await etsyAPI['makeRequest'](
      `/application/shops/${shopId}/listings/active?limit=${requestLimit}&offset=${offset}`
    );
    
    const listings = response.results || [];
    const totalCount = response.count || listings.length;
    const hasMore = listings.length === requestLimit && (offset + listings.length) < totalCount;

    // Transform listings to match component expectations
    const transformedListings = listings.map((listing: any) => ({
      listingId: listing.listing_id,
      userId: listing.user_id,
      shopSectionId: listing.shop_section_id,
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
      price: {
        amount: listing.price?.amount || 0,
        currencyCode: listing.price?.currency_code || 'USD',
      },
      taxonomyId: listing.taxonomy_id,
      tags: listing.tags || [],
      materials: listing.materials || [],
      shopSectionId3: listing.shop_section_id_3,
      style: listing.style || [],
      images: listing.images || [],
      shopId: listing.shop_id,
      productionPartnerIds: listing.production_partner_ids,
      taxonomyPath: listing.taxonomy_path,
      taxonomyIds: listing.taxonomy_ids,
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
