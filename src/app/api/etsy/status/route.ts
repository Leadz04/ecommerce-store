import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, EtsyOrder, Product } from '@/models';
import { getCurrentUserIdOptional } from '@/lib/etsy-auth-helper';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getCurrentUserIdOptional(request);
    const { searchParams } = new URL(request.url);
    const shopIdParam = searchParams.get('shopId');

    // Build query: filter by userId if authenticated, optionally by shopId
    const query: any = { isActive: true };
    if (userId) {
      query.userId = userId;
    }
    if (shopIdParam) {
      query.shopId = shopIdParam;
    }

    // Get shop(s) for this user
    const shop = shopIdParam 
      ? await EtsyShop.findOne(query)
      : await EtsyShop.findOne(query); // Get first active shop for user

    if (!shop) {
      // If user is authenticated but no shop found, return empty
      // If not authenticated, return not connected
      return NextResponse.json({
        success: true,
        connected: false,
        shops: userId ? [] : undefined, // Include empty shops array if authenticated
      });
    }

    // Build stats query with userId filter if authenticated
    const statsQuery: any = { shopId: shop.shopId };
    if (userId) {
      statsQuery.userId = userId;
    }

    const [listingCount, pendingOrderCount, totalOrderCount, exportedProductCount, listingAgg] = await Promise.all([
      EtsyListing.countDocuments(statsQuery),
      EtsyOrder.countDocuments({ ...statsQuery, shippingStatus: 'pending' }),
      EtsyOrder.countDocuments(statsQuery),
      Product.countDocuments({ etsyExported: true }), // This might need userId filter too if products are user-specific
      EtsyListing.aggregate([
        { $match: statsQuery },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
            totalFavorites: { $sum: '$numFavorers' },
          },
        },
      ]),
    ]);

    // Get all shops for this user (if authenticated)
    let allShops: any[] = [];
    if (userId) {
      const shops = await EtsyShop.find({ userId, isActive: true })
        .select('shopId shopName isActive lastSyncAt createdAt')
        .sort({ createdAt: -1 });
      allShops = shops;
    }

    return NextResponse.json({
      success: true,
      connected: true,
      shop: {
        shopId: shop.shopId,
        shopName: shop.shopName,
        isActive: shop.isActive,
        lastSyncAt: shop.lastSyncAt,
        createdAt: shop.createdAt,
      },
      shops: allShops.length > 0 ? allShops : undefined, // Include shops array if user has multiple
      stats: {
        listingsSynced: listingCount,
        ordersPending: pendingOrderCount,
        totalOrders: totalOrderCount,
        exportedProducts: exportedProductCount,
        totalViews: listingAgg?.[0]?.totalViews ?? 0,
        totalFavorites: listingAgg?.[0]?.totalFavorites ?? 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch Etsy status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Etsy status' },
      { status: 500 }
    );
  }
}


