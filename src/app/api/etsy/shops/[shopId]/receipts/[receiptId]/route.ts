import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';

/**
 * PUT /api/etsy/shops/[shopId]/receipts/[receiptId]
 * Update a receipt
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; receiptId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId, receiptId } = await params;
    const body = await request.json();

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

    // Convert update data to form-urlencoded format
    const formData = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Update receipt via Etsy API
    const updatedReceipt = await etsyAPI['makeRequest'](`/application/shops/${shopId}/receipts/${receiptId}`, {
      method: 'PUT',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return NextResponse.json({
      success: true,
      receipt: updatedReceipt,
    });
  } catch (error: any) {
    console.error('[Etsy Update Receipt API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to update receipt' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
