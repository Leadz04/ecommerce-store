import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

interface ApplyRepricingRequest {
  shopId: string;
  repricingRules: Array<{
    listingId: string;
    newPrice: number;
    reason: string;
    ruleType: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplyRepricingRequest = await request.json();
    const { shopId, repricingRules } = body;

    if (!shopId || !repricingRules || repricingRules.length === 0) {
      return NextResponse.json(
        { error: 'shopId and repricingRules are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(
      shop.accessToken,
      shop.shopId,
      shop.refreshToken,
      async (newTokens) => {
        await EtsyShop.updateOne(
          { shopId: shop.shopId },
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

    const results: Array<{ listingId: string; success: boolean; oldPrice?: number; newPrice?: number; error?: string }> = [];
    const errors: Array<{ listingId: string; error: string }> = [];

    // Apply repricing to each listing
    for (const rule of repricingRules) {
      try {
        // Get current listing to preserve currency and divisor
        const listing = await etsyAPI.getListing(rule.listingId);
        const oldPrice = listing.price.amount / listing.price.divisor;
        const newPriceInCents = Math.round(rule.newPrice * listing.price.divisor);

        // Update the listing price
        await etsyAPI.updateListing(rule.listingId, {
          price: {
            amount: newPriceInCents,
            divisor: listing.price.divisor,
            currency_code: listing.price.currency_code,
          },
        });

        results.push({
          listingId: rule.listingId,
          success: true,
          oldPrice,
          newPrice: rule.newPrice,
        });
      } catch (error: any) {
        const errorMsg = error?.message || 'Failed to update listing';
        errors.push({ listingId: rule.listingId, error: errorMsg });
        results.push({
          listingId: rule.listingId,
          success: false,
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: repricingRules.length,
        successful: results.filter((r) => r.success).length,
        failed: errors.length,
      },
    });
  } catch (error: any) {
    console.error('[Apply Repricing API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to apply repricing' },
      { status: 500 }
    );
  }
}

