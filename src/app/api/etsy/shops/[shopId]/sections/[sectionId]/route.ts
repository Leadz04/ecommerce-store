import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { invalidateCache } from '@/lib/etsy-cache';

/**
 * PUT /api/etsy/shops/[shopId]/sections/[sectionId]
 * Update a shop section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; sectionId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, sectionId } = await params;
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

    const section = await etsyAPI['makeRequest'](`/application/shops/${shopId}/sections/${sectionId}`, {
      method: 'PUT',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Invalidate cache after updating section
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-sections' });

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error: any) {
    console.error('[Etsy Update Shop Section API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to update shop section' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/etsy/shops/[shopId]/sections/[sectionId]
 * Delete a shop section
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; sectionId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, sectionId } = await params;

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

    await etsyAPI['makeRequest'](`/application/shops/${shopId}/sections/${sectionId}`, {
      method: 'DELETE',
    });

    // Invalidate cache after deleting section
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-sections' });

    return NextResponse.json({
      success: true,
      message: 'Shop section deleted successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Delete Shop Section API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to delete shop section' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
