import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, invalidateCache, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/sections
 * Get shop sections
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

    // Check cache first
    const cacheKey = generateCacheKey('shop-sections', { shopId });
    const cachedSections = await getCachedData<any[]>(cacheKey, userId);
    
    if (cachedSections) {
      return NextResponse.json({
        success: true,
        results: cachedSections,
      });
    }
    
    // Fetch from Etsy API
    const response = await etsyAPI['makeRequest'](`/application/shops/${shopId}/sections`);
    const sections = response.results || [];
    
    // Save to cache
    await setCachedData(cacheKey, userId, sections, CACHE_TTL.SHOP_SECTIONS, shopId);

    return NextResponse.json({
      success: true,
      results: sections,
      fromCache: false,
    });
  } catch (error: any) {
    console.error('[Etsy Shop Sections API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch shop sections' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/etsy/shops/[shopId]/sections
 * Create a shop section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
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
    formData.append('title', title);

    const section = await etsyAPI['makeRequest'](`/application/shops/${shopId}/sections`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate cache after creating new section
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-sections' });

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error: any) {
    console.error('[Etsy Create Shop Section API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to create shop section' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
