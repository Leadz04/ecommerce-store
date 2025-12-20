import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyOrder } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { invalidateCache } from '@/lib/etsy-cache';

/**
 * POST /api/etsy/shops/[shopId]/receipts/[receiptId]/shipment
 * Create a shipment/tracking for a receipt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; receiptId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, receiptId } = await params;
    const body = await request.json();
    const { tracking_code, carrier_name } = body;

    if (!tracking_code || !carrier_name) {
      return NextResponse.json(
        { error: 'tracking_code and carrier_name are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

    // Create EtsyAPI instance with token refresh callback
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

    // Create shipment via Etsy API
    const formData = new URLSearchParams();
    formData.append('tracking_code', tracking_code);
    formData.append('carrier_name', carrier_name);

    const shipment = await etsyAPI['makeRequest'](`/application/shops/${shopId}/receipts/${receiptId}/tracking`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Update DB order shipping status
    await EtsyOrder.findOneAndUpdate(
      { receiptId, userId },
      { $set: { shippingStatus: 'shipped', lastSyncedAt: new Date() } }
    );
    
    // Invalidate receipts cache
    await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-receipts' });

    return NextResponse.json({
      success: true,
      shipment,
    });
  } catch (error: any) {
    console.error('[Etsy Create Shipment API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to create shipment' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
