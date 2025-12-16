import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, EtsyOrder } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';

interface AnalyticsRequest {
  shopId: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'all';
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body: AnalyticsRequest = await request.json();
    const { shopId, period = '30d' } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

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

    // Calculate date range
    const now = Date.now();
    let startDate = 0;
    switch (period) {
      case '7d':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case '1y':
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
      default:
        startDate = 0;
    }

    // Fetch shop info from API (shop info changes frequently and is lightweight)
    const shopInfo = await etsyAPI.getShopInfo(shopId);
    // Update shop sync time
    await EtsyShop.updateOne(
      { shopId, userId },
      { $set: { lastSyncAt: new Date() } }
    );

    // Fetch listings from DB first
    let dbListings = await EtsyListing.find({ shopId, userId }).lean();
    const needsListingsRefresh = dbListings.length === 0 || dbListings.some(listing => 
      needsEtsyDataRefresh(listing.lastSyncedAt, 'listing')
    );

    let allListings: any[] = [];
    if (!needsListingsRefresh && dbListings.length > 0) {
      // Use DB listings
      allListings = dbListings.map(listing => ({
        listing_id: parseInt(listing.etsyListingId),
        title: listing.title,
        description: listing.description,
        views: listing.views || 0,
        num_favorers: listing.numFavorers || 0,
        category_path: listing.categoryPath || [],
        images: listing.images || [],
        price: {
          amount: Math.round(listing.price * 100),
          divisor: 100,
          currency_code: listing.currency || 'USD',
        },
        state: listing.state,
        quantity: listing.inventory?.quantity || 0,
      }));
    } else {
      // Fetch from API and update DB
      const etsyListings = await etsyAPI.getListings(shopId, 100, 0);
      allListings = etsyListings;
      
      // Update DB with fresh listings
      for (const listing of etsyListings) {
        const etsyListingId = listing.listing_id.toString();
        
        // Fetch images for the listing
        let images: Array<{ url: string; rank: number; listingImageId: string }> = [];
        try {
          const listingImages = await etsyAPI.getListingImages(etsyListingId);
          images = listingImages.map((img: any, index: number) => ({
            url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
            rank: img.rank ?? index,
            listingImageId: img.listing_image_id?.toString() || `${etsyListingId}-${index}`,
          })).filter((img: any) => img.url);
        } catch (error) {
          console.warn(`Failed to fetch images for listing ${etsyListingId} in analytics:`, error);
        }
        
        await EtsyListing.findOneAndUpdate(
          { etsyListingId },
          {
            $set: {
              userId,
              shopId,
              etsyListingId,
              title: listing.title,
              description: listing.description,
              price: listing.price.amount / listing.price.divisor,
              currency: listing.price.currency_code,
              state: listing.state,
              tags: listing.tags || [],
              materials: listing.materials || [],
              categoryPath: listing.category_path || [],
              images,
              inventory: { quantity: listing.quantity || 0 },
              views: listing.views || 0,
              numFavorers: listing.num_favorers || 0,
              lastSyncedAt: new Date(),
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    // Fetch orders from DB first
    let dbOrders = await EtsyOrder.find({ shopId, userId }).lean();
    const needsOrdersRefresh = dbOrders.length === 0 || dbOrders.some(order => 
      needsEtsyDataRefresh(order.lastSyncedAt, 'order')
    );

    let allOrders: any[] = [];
    if (!needsOrdersRefresh && dbOrders.length > 0) {
      // Use DB orders - transform to match API format
      allOrders = dbOrders.map(order => ({
        receipt_id: parseInt(order.receiptId),
        creation_timestamp: Math.floor((order.createdAt?.getTime() || Date.now()) / 1000),
        created_timestamp: Math.floor((order.createdAt?.getTime() || Date.now()) / 1000),
        grandtotal: {
          amount: Math.round(order.total * 100),
          divisor: 100,
          currency_code: order.currency || 'USD',
        },
        total_price: {
          amount: Math.round(order.total * 100),
          divisor: 100,
          currency_code: order.currency || 'USD',
        },
        transactions: order.items.map(item => ({
          listing_id: parseInt(item.listingId),
          quantity: item.quantity,
          price: {
            amount: Math.round(item.price * 100),
            divisor: 100,
            currency_code: order.currency || 'USD',
          },
        })),
      }));
    } else {
      // Fetch from API and update DB
      const etsyOrders = await etsyAPI.getOrders(shopId, 100, 0);
      allOrders = etsyOrders;
      
      // Update DB with fresh orders
      for (const order of etsyOrders) {
        const receiptId = order.receipt_id?.toString() || order.receiptId?.toString() || '';
        const etsyOrderId = receiptId; // Use receipt ID as order ID
        
        const orderData = {
          userId,
          etsyOrderId,
          shopId,
          receiptId,
          buyerUserId: order.buyer_user_id?.toString() || '',
          buyerEmail: order.buyer_email || '',
          status: order.was_paid ? 'completed' : 'open' as const,
          paymentStatus: order.was_paid ? 'paid' : 'pending' as const,
          shippingStatus: 'pending' as const,
          total: (order.grandtotal?.amount || order.total_price?.amount || 0) / (order.grandtotal?.divisor || order.total_price?.divisor || 100),
          currency: order.grandtotal?.currency_code || order.total_price?.currency_code || 'USD',
          shippingCost: (order.total_shipping_cost?.amount || 0) / (order.total_shipping_cost?.divisor || 100),
          taxCost: (order.total_tax_cost?.amount || 0) / (order.total_tax_cost?.divisor || 100),
          items: (order.transactions || []).map((t: any) => ({
            listingId: t.listing_id?.toString() || '',
            title: t.title || '',
            quantity: t.quantity || 1,
            price: (t.price?.amount || 0) / (t.price?.divisor || 100),
            variations: [],
          })),
          shippingAddress: {
            name: order.name || '',
            address1: order.first_line || '',
            address2: order.second_line || '',
            city: order.city || '',
            state: order.state || '',
            zip: order.zip || '',
            country: order.country_iso || '',
            phone: order.buyer_phone || '',
          },
          messageFromBuyer: order.message_from_buyer || '',
          lastSyncedAt: new Date(),
        };

        await EtsyOrder.findOneAndUpdate(
          { etsyOrderId },
          { $set: orderData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    // Filter orders by date range
    const filteredOrders = allOrders.filter((order: any) => {
      const orderDate = (order.creation_timestamp || order.created_timestamp || 0) * 1000;
      return orderDate >= startDate;
    });

    // Calculate sales metrics
    let totalRevenue = 0;
    let totalOrders = filteredOrders.length;
    let itemsSold = 0;
    const orderValues: number[] = [];
    const dailyRevenue: { [key: string]: number } = {};
    const listingSales: { [key: number]: { revenue: number; orders: number; views: number; favorers: number; title: string } } = {};

    filteredOrders.forEach((order: any) => {
      const orderDate = new Date((order.creation_timestamp || order.created_timestamp || 0) * 1000);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      const revenue = (order.grandtotal?.amount || order.total_price?.amount || 0) / (order.grandtotal?.divisor || order.total_price?.divisor || 100);
      totalRevenue += revenue;
      orderValues.push(revenue);

      // Daily revenue
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = 0;
      }
      dailyRevenue[dateKey] += revenue;

      // Count items from transactions
      if (order.transactions && Array.isArray(order.transactions)) {
        order.transactions.forEach((transaction: any) => {
          itemsSold += transaction.quantity || 1;
          
          const listingId = transaction.listing_id;
          if (listingId) {
            if (!listingSales[listingId]) {
              const listing = allListings.find((l: any) => l.listing_id === listingId);
              listingSales[listingId] = {
                revenue: 0,
                orders: 0,
                views: listing?.views || 0,
                favorers: listing?.num_favorers || 0,
                title: listing?.title || `Listing ${listingId}`,
              };
            }
            const itemRevenue = (transaction.price?.amount || 0) / (transaction.price?.divisor || 100);
            listingSales[listingId].revenue += itemRevenue;
            listingSales[listingId].orders += 1;
          }
        });
      }
    });

    // Calculate averages
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const salesVelocity = totalOrders > 0 ? totalOrders / Math.max(1, Math.ceil((now - startDate) / (24 * 60 * 60 * 1000))) : 0;

    // Top selling listings
    const topSellingListings = Object.entries(listingSales)
      .map(([listingId, data]) => ({
        listing_id: parseInt(listingId),
        title: data.title,
        revenue: data.revenue,
        orders: data.orders,
        views: data.views,
        favorers: data.favorers,
        conversionRate: data.views > 0 ? (data.orders / data.views) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Traffic metrics
    const totalViews = allListings.reduce((sum: number, listing: any) => sum + (listing.views || 0), 0);
    const totalFavorers = allListings.reduce((sum: number, listing: any) => sum + (listing.num_favorers || 0), 0);
    const averageViewsPerListing = allListings.length > 0 ? totalViews / allListings.length : 0;
    const averageFavorersPerListing = allListings.length > 0 ? totalFavorers / allListings.length : 0;

    // Daily breakdown for charts
    const dailyBreakdown = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Category breakdown (from listings)
    const categoryBreakdown: { [key: string]: { revenue: number; orders: number; listings: number } } = {};
    allListings.forEach((listing: any) => {
      const category = listing.category_path?.[listing.category_path.length - 1] || 'Uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { revenue: 0, orders: 0, listings: 0 };
      }
      categoryBreakdown[category].listings += 1;
      
      const listingSalesData = listingSales[listing.listing_id];
      if (listingSalesData) {
        categoryBreakdown[category].revenue += listingSalesData.revenue;
        categoryBreakdown[category].orders += listingSalesData.orders;
      }
    });

    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Conversion rates
    const overallConversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        itemsSold,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        salesVelocity: parseFloat(salesVelocity.toFixed(2)),
        overallConversionRate: parseFloat(overallConversionRate.toFixed(2)),
      },
      traffic: {
        totalViews,
        totalFavorers,
        totalListings: allListings.length,
        averageViewsPerListing: parseFloat(averageViewsPerListing.toFixed(1)),
        averageFavorersPerListing: parseFloat(averageFavorersPerListing.toFixed(1)),
      },
      topSellingListings,
      dailyBreakdown,
      topCategories,
      shopInfo: {
        shopName: shopInfo.shop_name || shopInfo.title,
        reviewAverage: shopInfo.review_average || 0,
        reviewCount: shopInfo.review_count || 0,
        activeListings: shopInfo.listing_active_count || 0,
      },
    });
  } catch (error: any) {
    console.error('[Etsy Analytics API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

