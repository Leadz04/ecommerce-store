import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { getCurrentUserId } from '@/lib/etsy-auth-helper';

/**
 * GET /api/etsy/shops
 * Get all shops for the current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    
    await connectDB();

    const shops = await EtsyShop.find({ userId, isActive: true })
      .select('shopId shopName isActive lastSyncAt createdAt updatedAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      shops: shops.map(shop => ({
        shopId: shop.shopId,
        shopName: shop.shopName,
        isActive: shop.isActive,
        lastSyncAt: shop.lastSyncAt,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('[Etsy Shops API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch shops' },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/etsy/shops?shopId=XXX
 * Disconnect/remove a shop for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    // Soft delete: set isActive to false instead of actually deleting
    const result = await EtsyShop.updateOne(
      { userId, shopId },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Shop not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Shop disconnected successfully',
    });
  } catch (error: any) {
    console.error('[Etsy Shops API] Delete Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to disconnect shop' },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
