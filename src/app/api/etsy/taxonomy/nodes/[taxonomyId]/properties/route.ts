import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyPublicAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/taxonomy/nodes/[taxonomyId]/properties
 * Get properties for a taxonomy node (buyer or seller)
 * Query params: type=buyer|seller, shopId (required for seller)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taxonomyId: string }> }
) {
  try {
    const { taxonomyId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'seller'; // 'buyer' or 'seller'
    const shopId = searchParams.get('shopId');

    await connectDB();

    // For seller taxonomy, we need authentication
    if (type === 'seller') {
      const userId = await getCurrentUserId(request);
      if (!shopId) {
        return NextResponse.json({ error: 'shopId is required for seller taxonomy' }, { status: 400 });
      }

      const shop = await getUserShop(userId, shopId);
      if (!shop) {
        return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
      }

      // Check cache
      const cacheKey = generateCacheKey('seller-taxonomy-properties', { taxonomyId });
      const cachedProperties = await getCachedData<any[]>(cacheKey, userId);
      
      if (cachedProperties) {
        return NextResponse.json({
          success: true,
          results: cachedProperties,
        });
      }

      // Fetch from Etsy API
      const properties = await EtsyPublicAPI.request(`/application/seller-taxonomy/nodes/${taxonomyId}/properties`);
      
      // Cache the results
      await setCachedData(cacheKey, userId, properties.results || [], CACHE_TTL.TAXONOMY_PROPERTIES, shopId);

      return NextResponse.json({
        success: true,
        results: properties.results || [],
      });
    } else {
      // Buyer taxonomy is public
      // Check cache
      const cacheKey = generateCacheKey('buyer-taxonomy-properties', { taxonomyId });
      const cachedProperties = await getCachedData<any[]>(cacheKey, 'public');
      
      if (cachedProperties) {
        return NextResponse.json({
          success: true,
          results: cachedProperties,
        });
      }

      // Fetch from Etsy API
      const properties = await EtsyPublicAPI.request(`/application/buyer-taxonomy/nodes/${taxonomyId}/properties`);
      
      // Cache the results
      await setCachedData(cacheKey, 'public', properties.results || [], CACHE_TTL.TAXONOMY_PROPERTIES);

      return NextResponse.json({
        success: true,
        results: properties.results || [],
      });
    }
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
