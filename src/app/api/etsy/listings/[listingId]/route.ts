import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

export async function PUT(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = params.listingId;
    const body = await request.json();
    const { shopId, ...updateData } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    await connectDB();

    // Get shop from query params or request body
    const { searchParams } = new URL(request.url);
    const shopIdParam = searchParams.get('shopId') || shopId;

    if (!shopIdParam) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    const shop = await EtsyShop.findOne({ shopId: shopIdParam, isActive: true });
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

    // Update the listing
    const updatedListing = await etsyAPI.updateListing(listingId, updateData);

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error: any) {
    console.error('[Etsy Update Listing API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update listing' },
      { status: 500 }
    );
  }
}

