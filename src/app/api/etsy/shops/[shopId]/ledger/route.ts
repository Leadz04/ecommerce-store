import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';

/**
 * GET /api/etsy/shops/[shopId]/ledger
 * Get shop ledger entries - matches Business Suite component expectations
 * Note: Etsy API requires min_created and max_created, so we default to last 30 days if not provided
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
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Default to last 30 days if not provided
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const minCreated = searchParams.get('min_created') 
      ? parseInt(searchParams.get('min_created')!, 10) 
      : thirtyDaysAgo;
    const maxCreated = searchParams.get('max_created') 
      ? parseInt(searchParams.get('max_created')!, 10) 
      : now;

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

    // Get ledger entries from Etsy API
    const response = await etsyAPI.getShopLedgerEntries(shopId, {
      min_created: minCreated,
      max_created: maxCreated,
      limit,
      offset,
    });

    const ledgerEntries = response.results || [];

    // Transform ledger entries to match component expectations
    const transformedEntries = ledgerEntries.map((entry: any) => ({
      entryId: entry.entry_id,
      ledgerId: entry.ledger_id,
      sequenceNumber: entry.sequence_number,
      amount: entry.amount / (entry.divisor || 1),
      currency: entry.currency,
      description: entry.description,
      balance: entry.balance / (entry.balance_divisor || 1),
      createDate: entry.create_date,
      updateDate: entry.update_date,
    }));

    return NextResponse.json({
      success: true,
      results: transformedEntries,
      count: transformedEntries.length,
    });
  } catch (error: any) {
    console.error('[Etsy Shop Ledger API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch ledger entries' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
