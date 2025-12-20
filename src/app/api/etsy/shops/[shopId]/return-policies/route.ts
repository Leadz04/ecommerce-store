import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, invalidateCache, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/return-policies
 * Get return policies for a shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;

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
    const cacheKey = generateCacheKey('return-policies', { shopId });
    const cachedPolicies = await getCachedData<any[]>(cacheKey, userId);
    
    if (cachedPolicies) {
      return NextResponse.json({
        success: true,
        results: cachedPolicies,
      });
    }
    
    // Fetch from Etsy API
    const response = await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return`);
    const policies = response.results || [];
    
    // Save to cache
    await setCachedData(cacheKey, userId, policies, CACHE_TTL.RETURN_POLICIES, shopId);

    return NextResponse.json({
      success: true,
      results: policies,
    });
  } catch (error: any) {
    console.error('[Etsy Return Policies API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch return policies' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/etsy/shops/[shopId]/return-policies
 * Create a return policy
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const body = await request.json();
    const { accepts_returns, accepts_exchanges, return_deadline } = body;

    if (accepts_returns === undefined || accepts_exchanges === undefined) {
      return NextResponse.json({ error: 'accepts_returns and accepts_exchanges are required' }, { status: 400 });
    }

    // Validate: if accepts_returns or accepts_exchanges is true, return_deadline is required
    if ((accepts_returns || accepts_exchanges) && !return_deadline) {
      return NextResponse.json({ error: 'return_deadline is required when accepting returns or exchanges' }, { status: 400 });
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

    const formData = new URLSearchParams();
    formData.append('accepts_returns', accepts_returns.toString());
    formData.append('accepts_exchanges', accepts_exchanges.toString());
    if (return_deadline) {
      formData.append('return_deadline', return_deadline.toString());
    }

    const policy = await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate cache after creating new policy
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'return-policies' });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: any) {
    console.error('[Etsy Create Return Policy API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to create return policy' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
