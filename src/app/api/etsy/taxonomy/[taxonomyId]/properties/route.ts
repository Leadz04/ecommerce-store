import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/taxonomy/[taxonomyId]/properties
 * Get available properties for a taxonomy (for variations)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taxonomyId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { taxonomyId } = await params;
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

    // Check cache first (taxonomy properties rarely change)
    const cacheKey = generateCacheKey('taxonomy-properties', { taxonomyId });
    const cachedProperties = await getCachedData<any[]>(cacheKey, userId);
    
    if (cachedProperties) {
      return NextResponse.json({
        success: true,
        results: cachedProperties,
      });
    }
    
    // Get properties for the buyer taxonomy
    const response = await etsyAPI['makeRequest'](`/application/buyer-taxonomy/nodes/${taxonomyId}/properties`);
    const properties = response.results || [];
    
    // Save to cache (long TTL since taxonomy properties rarely change)
    await setCachedData(cacheKey, userId, properties, CACHE_TTL.TAXONOMY_PROPERTIES, shopId);

    return NextResponse.json({
      success: true,
      results: properties,
    });
  } catch (error: any) {
    console.error('[Etsy Taxonomy Properties API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch taxonomy properties' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
