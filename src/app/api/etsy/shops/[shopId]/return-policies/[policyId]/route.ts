import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { invalidateCache, generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/return-policies/[policyId]
 * Get a single return policy
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
    const cacheKey = generateCacheKey('return-policy', { shopId, policyId });
    const cachedPolicy = await getCachedData<any>(cacheKey, userId);
    
    if (cachedPolicy) {
      return NextResponse.json({
        success: true,
        policy: cachedPolicy,
      });
    }
    
    // Fetch from Etsy API
    const policy = await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return/${policyId}`);
    
    // Save to cache
    await setCachedData(cacheKey, userId, policy, CACHE_TTL.RETURN_POLICIES, shopId);

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: any) {
    console.error('[Etsy Get Return Policy API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch return policy' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * PUT /api/etsy/shops/[shopId]/return-policies/[policyId]
 * Update a return policy
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; policyId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, policyId } = await params;
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

    const policy = await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return/${policyId}`, {
      method: 'PUT',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate cache after updating policy
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'return-policies' });
    await invalidateCache(userId, { shopId, policyId, cacheKeyPattern: 'return-policy' });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: any) {
    console.error('[Etsy Update Return Policy API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to update return policy' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/etsy/shops/[shopId]/return-policies/[policyId]
 * Delete a return policy
 */
export async function DELETE(
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

    await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return/${policyId}`, {
      method: 'DELETE',
    });

    // Invalidate cache after deleting policy
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'return-policies' });
    await invalidateCache(userId, { shopId, policyId, cacheKeyPattern: 'return-policy' });

    return NextResponse.json({
      success: true,
      message: 'Return policy deleted successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Delete Return Policy API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to delete return policy' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
