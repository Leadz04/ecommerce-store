import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const shops = await EtsyShop.find({ isActive: true });
    
    return NextResponse.json({
      success: true,
      shops: shops.map(shop => ({
        shopId: shop.shopId,
        shopName: shop.shopName,
        isActive: shop.isActive,
        syncSettings: shop.syncSettings,
        lastSyncAt: shop.lastSyncAt,
        createdAt: shop.createdAt,
      })),
    });

  } catch (error) {
    console.error('Failed to fetch Etsy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { shopId, syncSettings } = await request.json();

    await connectDB();

    const shop = await EtsyShop.findOne({ shopId });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    shop.syncSettings = {
      ...shop.syncSettings,
      ...syncSettings,
    };

    await shop.save();

    return NextResponse.json({
      success: true,
      message: 'Sync settings updated successfully',
      shop: {
        shopId: shop.shopId,
        shopName: shop.shopName,
        syncSettings: shop.syncSettings,
      },
    });

  } catch (error) {
    console.error('Failed to update Etsy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
