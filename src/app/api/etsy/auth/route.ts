import { NextRequest, NextResponse } from 'next/server';
import { getEtsyAuthUrl, exchangeCodeForToken } from '@/lib/etsy';
import { EtsyShop } from '@/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      // Generate auth URL and redirect
      const authUrl = await getEtsyAuthUrl();
      return NextResponse.redirect(authUrl);
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);
    
    await connectDB();

    // Get shop information
    const { EtsyAPI } = await import('@/lib/etsy');
    const etsyAPI = new EtsyAPI(tokenResponse.access_token);
    const shops = await etsyAPI.getShopsForUser();
    
    if (shops.length === 0) {
      return NextResponse.json({ error: 'No shops found for this user' }, { status: 400 });
    }

    const shop = shops[0]; // Use first shop

    // Save shop information
    const etsyShop = new EtsyShop({
      shopId: shop.shop_id.toString(),
      shopName: shop.shop_name,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      isActive: true,
      syncSettings: {
        autoSyncProducts: true,
        autoSyncOrders: true,
        autoSyncInventory: true,
        syncInterval: 60,
      },
    });

    await etsyShop.save();

    return NextResponse.json({
      success: true,
      message: 'Etsy shop connected successfully',
      shop: {
        shopId: etsyShop.shopId,
        shopName: etsyShop.shopName,
        isActive: etsyShop.isActive,
      },
    });

  } catch (error) {
    console.error('Etsy auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Etsy' },
      { status: 500 }
    );
  }
}
