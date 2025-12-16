import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const listingId = searchParams.get('listingId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!shopId && !listingId) {
      return NextResponse.json({ error: 'shopId or listingId is required' }, { status: 400 });
    }

    await connectDB();

    // Get shop info (required for auth)
    let shop;
    if (shopId) {
      shop = await EtsyShop.findOne({ shopId, isActive: true });
    } else {
      // If only listingId provided, find shop from any active shop (for now)
      shop = await EtsyShop.findOne({ isActive: true });
    }

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

    // Fetch reviews
    let reviews;
    if (listingId) {
      reviews = await etsyAPI.getListingReviews(listingId, limit, offset);
    } else {
      reviews = await etsyAPI.getShopReviews(shopId!, limit, offset);
    }

    // Calculate statistics
    const stats = {
      total: reviews.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : 0,
      ratingDistribution: {
        5: reviews.filter((r: any) => r.rating === 5).length,
        4: reviews.filter((r: any) => r.rating === 4).length,
        3: reviews.filter((r: any) => r.rating === 3).length,
        2: reviews.filter((r: any) => r.rating === 2).length,
        1: reviews.filter((r: any) => r.rating === 1).length,
      },
      withText: reviews.filter((r: any) => r.review && r.review.trim().length > 0).length,
      withImages: reviews.filter((r: any) => r.image_url_fullxfull).length,
    };

    return NextResponse.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error: any) {
    console.error('[Etsy Reviews API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

