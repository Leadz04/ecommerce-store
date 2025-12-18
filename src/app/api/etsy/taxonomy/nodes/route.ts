import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyPublicAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/taxonomy/nodes
 * Get taxonomy nodes (buyer or seller)
 * Query params: type=buyer|seller, shopId (required for seller)
 */
export async function GET(request: NextRequest) {
  try {
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
      const cacheKey = generateCacheKey('seller-taxonomy-nodes', {});
      const cachedNodes = await getCachedData<any>(cacheKey, userId);
      
      if (cachedNodes) {
        return NextResponse.json({
          success: true,
          results: cachedNodes,
        });
      }

      // Fetch from Etsy API
      const response = await EtsyPublicAPI.getSellerTaxonomyNodes();
      const nodes = response.results || response;
      
      // Cache the results (taxonomy rarely changes)
      await setCachedData(cacheKey, userId, nodes, CACHE_TTL.TAXONOMY_PROPERTIES, shopId);

      return NextResponse.json({
        success: true,
        results: nodes,
      });
    } else {
      // Buyer taxonomy is public, no auth needed
      // Check cache (use a generic key)
      const cacheKey = generateCacheKey('buyer-taxonomy-nodes', {});
      const cachedNodes = await getCachedData<any>(cacheKey, 'public');
      
      if (cachedNodes) {
        return NextResponse.json({
          success: true,
          results: cachedNodes,
        });
      }

      // Fetch from Etsy API
      const response = await EtsyPublicAPI.getBuyerTaxonomyNodes();
      const nodes = response.results || response;
      
      // Cache the results (use a generic userId for public data)
      await setCachedData(cacheKey, 'public', nodes, CACHE_TTL.TAXONOMY_PROPERTIES);

      return NextResponse.json({
        success: true,
        results: nodes,
      });
    }
  } catch (error: any) {
    console.error('[Etsy Taxonomy Nodes API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch taxonomy nodes' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
