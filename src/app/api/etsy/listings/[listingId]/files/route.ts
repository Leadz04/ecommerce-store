import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL, invalidateCache } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/listings/[listingId]/files
 * Get digital files for a listing
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

        // Check cache
        const cacheKey = generateCacheKey('listing-files', { listingId });
        const cachedFiles = await getCachedData<any[]>(cacheKey, userId);

        if (cachedFiles) {
            return NextResponse.json({ success: true, results: cachedFiles });
        }

        const files = await etsyAPI.getListingFiles(listingId);
        await setCachedData(cacheKey, userId, files, CACHE_TTL.LISTING_DETAILS, shopId, listingId);

        return NextResponse.json({ success: true, results: files });
    } catch (error: any) {
        console.error('[Etsy Listing Files API] Error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to fetch listing files' },
            { status: error?.message?.includes('authentication') ? 401 : 500 }
        );
    }
}

/**
 * POST /api/etsy/listings/[listingId]/files
 * Upload a file to a listing
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

        const formData = await request.formData();
        const result = await etsyAPI.uploadListingFile(listingId, formData);

        await invalidateCache(userId, { shopId, listingId });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('[Etsy Upload File API] Error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/etsy/listings/[listingId]/files
 * Delete a file from a listing
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ listingId: string }> }
) {
    try {
        const userId = await getCurrentUserId(request);
        const { listingId } = await params;
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shopId');
        const fileId = searchParams.get('fileId');

        if (!shopId || !fileId) {
            return NextResponse.json({ error: 'shopId and fileId are required' }, { status: 400 });
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

        await etsyAPI.deleteListingFile(listingId, fileId);
        await invalidateCache(userId, { shopId, listingId });

        return NextResponse.json({ success: true, message: 'File deleted successfully' });
    } catch (error: any) {
        console.error('[Etsy Delete File API] Error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to delete file' },
            { status: 500 }
        );
    }
}
