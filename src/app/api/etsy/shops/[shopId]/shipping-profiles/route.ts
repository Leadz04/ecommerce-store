import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, invalidateCache, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/shipping-profiles
 * Get shipping profiles for a shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

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

    // Invalidate cache if force refresh requested
    if (forceRefresh) {
      await invalidateCache(userId, { shopId, cacheKeyPattern: 'shipping-profiles' });
    }

    // Check cache first (unless forcing refresh)
    const cacheKey = generateCacheKey('shipping-profiles', { shopId });
    const cachedProfiles = await getCachedData<any[]>(cacheKey, userId);
    
    if (cachedProfiles && !forceRefresh) {
      return NextResponse.json({
        success: true,
        results: cachedProfiles,
        fromCache: true,
      });
    }
    
    // Fetch from Etsy API
    const profiles = await etsyAPI.getShippingProfiles(shopId);
    
    // Save to cache
    await setCachedData(cacheKey, userId, profiles, CACHE_TTL.SHIPPING_PROFILES, shopId);

    return NextResponse.json({
      success: true,
      results: profiles,
      fromCache: false,
    });
  } catch (error: any) {
    console.error('[Etsy Shipping Profiles API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch shipping profiles' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/etsy/shops/[shopId]/shipping-profiles
 * Create a shipping profile
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
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

    const profile = await etsyAPI['makeRequest'](`/application/shops/${shopId}/shipping-profiles`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate cache after creating new profile
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shipping-profiles' });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[Etsy Create Shipping Profile API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to create shipping profile' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
