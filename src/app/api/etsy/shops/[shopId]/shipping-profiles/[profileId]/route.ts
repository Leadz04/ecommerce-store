import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { invalidateCache } from '@/lib/etsy-cache';

/**
 * PUT /api/etsy/shops/[shopId]/shipping-profiles/[profileId]
 * Update a shipping profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; profileId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, profileId } = await params;
    const body = await request.json();

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

    // Convert to form-urlencoded
    const formData = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const profile = await etsyAPI['makeRequest'](`/application/shops/${shopId}/shipping-profiles/${profileId}`, {
      method: 'PUT',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate cache after updating profile
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shipping-profiles' });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[Etsy Update Shipping Profile API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to update shipping profile' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/etsy/shops/[shopId]/shipping-profiles/[profileId]
 * Delete a shipping profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; profileId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, profileId } = await params;

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

    await etsyAPI['makeRequest'](`/application/shops/${shopId}/shipping-profiles/${profileId}`, {
      method: 'DELETE',
    });

    // Invalidate cache after deleting profile
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shipping-profiles' });

    return NextResponse.json({
      success: true,
      message: 'Shipping profile deleted successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Delete Shipping Profile API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to delete shipping profile' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
