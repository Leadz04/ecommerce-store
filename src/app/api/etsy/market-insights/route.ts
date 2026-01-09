import { NextRequest, NextResponse } from 'next/server';
import { EtsyPublicAPI } from '@/lib/etsy';

interface MarketInsightsRequest {
  keywords?: string;
  minPrice?: number;
  maxPrice?: number;
  taxonomyId?: number;
  shopLocation?: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: MarketInsightsRequest & { isStarSeller?: boolean } = await request.json();
    const {
      keywords,
      minPrice,
      maxPrice,
      taxonomyId,
      shopLocation,
      isStarSeller,
      limit = 50,
    } = body;

    if (!keywords && !taxonomyId) {
      return NextResponse.json(
        { error: 'Provide at least keywords or taxonomyId for market insights.' },
        { status: 400 }
      );
    }

    // Call Etsy public search with pagination
    const maxPerRequest = 100;
    const targetLimit = Math.min(Math.max(limit, 1), 500);

    // Safety break to prevent infinite loops if few results match
    const maxRequests = 20;

    let allResults: any[] = [];
    let totalCount = 0;
    let offset = 0;
    let requestedLimit = 0;

    try {
      for (let i = 0; i < maxRequests && allResults.length < targetLimit; i++) {
        // Fetch a full batch to filter from
        const raw = await EtsyPublicAPI.searchActiveListings({
          keywords,
          min_price: minPrice,
          max_price: maxPrice,
          taxonomy_id: taxonomyId,
          shop_location: shopLocation,
          limit: maxPerRequest,
          offset: offset,
          includes: 'Images,Shop',
        } as any);

        const batchResults = Array.isArray(raw.results) ? raw.results : [];
        totalCount = raw.count || totalCount;

        // Filter batch if needed
        const filteredBatch = isStarSeller
          ? batchResults.filter((item: any) => item.shop?.is_star_seller)
          : batchResults;

        allResults = [...allResults, ...filteredBatch];

        // Prepare next offset
        offset += maxPerRequest;

        // Stop if we've exhausted available results from API
        if (batchResults.length < maxPerRequest) {
          break;
        }

        // Small delay to respect rate limits
        if (allResults.length < targetLimit) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Trim to exact limit if we over-fetched
      if (allResults.length > targetLimit) {
        allResults = allResults.slice(0, targetLimit);
      }

    } catch (apiError: any) {
      console.error('[Market Insights] Etsy API error:', apiError);
      const errorMessage = apiError?.message || 'Etsy API request failed';
      // Check if it's an API key issue
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        return NextResponse.json(
          { error: 'Etsy API authentication failed. Please check your ETSY_X_API_KEY or ETSY_CLIENT_ID environment variable.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const results = allResults;

    // Normalize basic listing info only (no detailed fetching for performance)
    // Details (images, videos, description) will be fetched on-demand when user expands a row
    const listings = results.map((item: any) => {
      const priceAmount = item.price?.amount ?? 0;
      const priceDivisor = item.price?.divisor ?? 100;
      const priceCurrency = item.price?.currency_code ?? 'USD';
      const priceValue = priceDivisor > 0 ? priceAmount / priceDivisor : 0;

      return {
        listing_id: item.listing_id,
        title: item.title,
        url: item.url,
        price: priceValue,
        currency: priceCurrency,
        views: item.views ?? null,
        num_favorers: item.num_favorers ?? null,
        shop_id: item.shop_id ?? null,
        shop_name: item.shop?.shop_name ?? null,
        is_star_seller: item.shop?.is_star_seller ?? false,
        shop_location_country: item.shop?.shop_location_country_iso ?? null,
        taxonomy_id: item.taxonomy_id ?? null,
        category_path: item.category_path ?? [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        // Include images from the search results
        description: item.description ?? null,
        images: Array.isArray(item.images) ? item.images : (Array.isArray(item.Images) ? item.Images : []),
        videos: null,
        created_timestamp: item.creation_timestamp ?? item.created_timestamp ?? null,
      };
    });

    // Sort listings: Star Sellers first, then by views
    listings.sort((a, b) => {
      if (a.is_star_seller !== b.is_star_seller) {
        return a.is_star_seller ? -1 : 1;
      }
      // Secondary sort by views (highest on top)
      return (b.views || 0) - (a.views || 0);
    });

    // Compute simple stats
    const priceValues = listings.map((l) => l.price).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    const minPriceVal = priceValues.length ? Math.min(...priceValues) : 0;
    const maxPriceVal = priceValues.length ? Math.max(...priceValues) : 0;
    const avgPriceVal = priceValues.length
      ? priceValues.reduce((sum, v) => sum + v, 0) / priceValues.length
      : 0;

    const withViews = listings.filter((l) => typeof l.views === 'number');
    const avgViews =
      withViews.length > 0
        ? withViews.reduce((sum, l) => sum + (l.views as number), 0) / withViews.length
        : 0;

    const withFavorites = listings.filter((l) => typeof l.num_favorers === 'number');
    const avgFavorites =
      withFavorites.length > 0
        ? withFavorites.reduce((sum, l) => sum + (l.num_favorers as number), 0) / withFavorites.length
        : 0;

    // Top keywords from titles (very simple tokenization)
    const keywordCounts: Record<string, number> = {};
    listings.forEach((l) => {
      if (!l.title) return;
      l.title
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((t) => t.length > 3)
        .forEach((token) => {
          keywordCounts[token] = (keywordCounts[token] || 0) + 1;
        });
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));

    // Top tags aggregation (from listing tags array)
    const tagCounts: Record<string, number> = {};
    listings.forEach((l: any) => {
      if (Array.isArray(l.tags) && l.tags.length > 0) {
        l.tags.forEach((tag: string) => {
          const normalizedTag = tag.trim().toLowerCase();
          if (normalizedTag) {
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([tag, count]) => ({ tag, count }));

    // Top sellers aggregation (group by shop_id)
    const shopsMap: Record<string, {
      shop_id: number;
      shop_name: string | null;
      is_star_seller: boolean;
      listingCount: number;
      totalPrice: number;
      totalViews: number;
      totalFavorites: number;
      listings: any[];
    }> = {};

    listings.forEach((l: any) => {
      if (!l.shop_id) return;
      const shopKey = String(l.shop_id);

      if (!shopsMap[shopKey]) {
        shopsMap[shopKey] = {
          shop_id: l.shop_id,
          shop_name: l.shop_name || null,
          is_star_seller: l.is_star_seller || false,
          listingCount: 0,
          totalPrice: 0,
          totalViews: 0,
          totalFavorites: 0,
          listings: [],
        };
      }

      const shop = shopsMap[shopKey];
      shop.listingCount += 1;
      shop.totalPrice += l.price;
      if (typeof l.views === 'number') shop.totalViews += l.views;
      if (typeof l.num_favorers === 'number') shop.totalFavorites += l.num_favorers;
      shop.listings.push(l);
    });

    const topSellers = Object.values(shopsMap)
      .map((shop) => {
        // Calculate engagement score as proxy for sales potential
        // Higher views and favorites indicate better performance
        const engagementScore = shop.totalViews * 0.7 + shop.totalFavorites * 10;

        return {
          shop_id: shop.shop_id,
          shop_name: shop.shop_name || 'Unknown Shop',
          is_star_seller: shop.is_star_seller,
          listingCount: shop.listingCount,
          averagePrice: shop.listingCount > 0 ? shop.totalPrice / shop.listingCount : 0,
          averageViews: shop.listingCount > 0 ? shop.totalViews / shop.listingCount : 0,
          averageFavorites: shop.listingCount > 0 ? shop.totalFavorites / shop.listingCount : 0,
          totalViews: shop.totalViews,
          totalFavorites: shop.totalFavorites,
          engagementScore,
        };
      })
      .sort((a, b) => {
        // Prioritize Star Sellers
        if (a.is_star_seller !== b.is_star_seller) {
          return a.is_star_seller ? -1 : 1;
        }
        // Then sort by engagement score
        if (Math.abs(b.engagementScore - a.engagementScore) > 0.1) {
          return b.engagementScore - a.engagementScore;
        }
        if (b.listingCount !== a.listingCount) {
          return b.listingCount - a.listingCount;
        }
        return b.averageViews - a.averageViews;
      });

    return NextResponse.json({
      success: true,
      query: {
        keywords,
        minPrice,
        maxPrice,
        taxonomyId,
        shopLocation,
        limit: requestedLimit,
        totalAvailable: totalCount,
      },
      summary: {
        totalListings: listings.length,
        minPrice: Number(minPriceVal.toFixed(2)),
        maxPrice: Number(maxPriceVal.toFixed(2)),
        averagePrice: Number(avgPriceVal.toFixed(2)),
        averageViews: Number(avgViews.toFixed(1)),
        averageFavorites: Number(avgFavorites.toFixed(1)),
      },
      topKeywords,
      topTags,
      topSellers,
      listings,
    });
  } catch (error: any) {
    console.error('[Etsy Market Insights API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch market insights' },
      { status: 500 }
    );
  }
}


