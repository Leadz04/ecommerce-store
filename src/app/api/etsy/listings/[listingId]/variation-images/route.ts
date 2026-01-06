import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL, invalidateCache } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/listings/[listingId]/variation-images
 * Get variation images
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ listingId: string }> }
) {
    try {
        const userId = await getCurrentUserId(request);
        const { listingId } = await params;
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

        // Variation images might not be heavily cached or change often effectively with listing details
        const cacheKey = generateCacheKey('listing-variation-images', { listingId });
        const cachedData = await getCachedData<any>(cacheKey, userId);

        if (cachedData) {
            return NextResponse.json({ success: true, results: cachedData });
        }

        const data = await etsyAPI.getVariationImages(listingId);
        await setCachedData(cacheKey, userId, data, CACHE_TTL.LISTING_DETAILS, shopId, listingId);

        return NextResponse.json({ success: true, results: data });
    } catch (error: any) {
        console.error('[Etsy Variation Images API] Error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to fetch variation images' },
            { status: error?.message?.includes('authentication') ? 401 : 500 }
        );
    }
}

/**
 * POST /api/etsy/listings/[listingId]/variation-images
 * Update variation images
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ listingId: string }> }
) {
    try {
        const userId = await getCurrentUserId(request);
        const { listingId } = await params;
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

        const body = await request.json();
        const result = await etsyAPI.updateVariationImages(listingId, body.variation_images);

        await invalidateCache(userId, { shopId, listingId });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('[Etsy Update Variation Images API] Error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to update variation images' },
            { status: 500 }
        );
    }
}
