import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/return-policies/[policyId]/listings
 * Get listings using a specific return policy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; policyId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, policyId } = await params;

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

    // Check cache first
    const cacheKey = generateCacheKey('return-policy-listings', { shopId, policyId });
    const cachedListings = await getCachedData<any[]>(cacheKey, userId);
    
    if (cachedListings) {
      return NextResponse.json({
        success: true,
        results: cachedListings,
      });
    }
    
    // Fetch from Etsy API
    const response = await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return/${policyId}/listings`);
    const listings = response.results || [];
    
    // Save to cache
    await setCachedData(cacheKey, userId, listings, CACHE_TTL.LISTING, shopId);

    return NextResponse.json({
      success: true,
      results: listings,
    });
  } catch (error: any) {
    console.error('[Etsy Get Return Policy Listings API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch return policy listings' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
