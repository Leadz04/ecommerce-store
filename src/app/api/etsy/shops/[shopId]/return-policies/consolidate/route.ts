import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { invalidateCache } from '@/lib/etsy-cache';

/**
 * POST /api/etsy/shops/[shopId]/return-policies/consolidate
 * Consolidate return policies by moving listings from source to destination and deleting source
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const body = await request.json();
    const { source_return_policy_id, destination_return_policy_id } = body;

    if (!source_return_policy_id || !destination_return_policy_id) {
      return NextResponse.json({ 
        error: 'source_return_policy_id and destination_return_policy_id are required' 
      }, { status: 400 });
    }

    if (source_return_policy_id === destination_return_policy_id) {
      return NextResponse.json({ 
        error: 'Source and destination policies must be different' 
      }, { status: 400 });
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
    formData.append('source_return_policy_id', source_return_policy_id.toString());
    formData.append('destination_return_policy_id', destination_return_policy_id.toString());

    const policy = await etsyAPI['makeRequest'](`/application/shops/${shopId}/policies/return/consolidate`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate all return policy caches after consolidation
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'return-policies' });
    await invalidateCache(userId, { shopId, policyId: source_return_policy_id, cacheKeyPattern: 'return-policy' });
    await invalidateCache(userId, { shopId, policyId: destination_return_policy_id, cacheKeyPattern: 'return-policy' });
    await invalidateCache(userId, { shopId, policyId: source_return_policy_id, cacheKeyPattern: 'return-policy-listings' });
    await invalidateCache(userId, { shopId, policyId: destination_return_policy_id, cacheKeyPattern: 'return-policy-listings' });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: any) {
    console.error('[Etsy Consolidate Return Policies API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to consolidate return policies' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
