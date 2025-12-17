import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';

/**
 * GET /api/etsy/shops/[shopId]/payments
 * Get shop payments - matches Business Suite component expectations
 * Note: Etsy API requires payment_ids, so we'll fetch receipts first and get payments for those receipts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
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

    // Get recent receipts to fetch payments for them
    const receiptsResponse = await etsyAPI.getShopReceipts(shopId, { limit: limit });
    const receipts = receiptsResponse.results || [];

    // Fetch payments for each receipt
    const allPayments: any[] = [];
    for (const receipt of receipts.slice(0, limit)) {
      try {
        const paymentResponse = await etsyAPI.getShopPaymentByReceiptId(shopId, receipt.receipt_id.toString());
        if (paymentResponse.results && Array.isArray(paymentResponse.results)) {
          allPayments.push(...paymentResponse.results);
        } else if (paymentResponse.payment_id) {
          // Single payment object
          allPayments.push(paymentResponse);
        }
      } catch (error) {
        // Some receipts may not have payments yet, skip them
        console.warn(`No payment found for receipt ${receipt.receipt_id}`);
      }
    }

    // Transform payments to match component expectations
    const transformedPayments = allPayments.map((payment: any) => ({
      paymentId: payment.payment_id,
      receiptId: payment.receipt_id,
      amount: {
        amount: payment.amount?.amount / (payment.amount?.divisor || 1) || 0,
        currencyCode: payment.amount?.currency_code || 'USD',
      },
      currencyCode: payment.currency_code,
      createTimestamp: payment.create_timestamp,
      updateTimestamp: payment.update_timestamp,
    }));

    return NextResponse.json({
      success: true,
      results: transformedPayments,
      count: transformedPayments.length,
    });
  } catch (error: any) {
    console.error('[Etsy Shop Payments API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch payments' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
