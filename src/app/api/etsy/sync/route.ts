import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, EtsyOrder, Product } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';
import { getCurrentUserId } from '@/lib/etsy-auth-helper';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { type, shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    // Find shop belonging to this user
    const shop = await EtsyShop.findOne({ userId, shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(
      shop.accessToken,
      shop.shopId,
      shop.refreshToken,
      async (newTokens) => {
        console.log(`Refreshing tokens for shop ${shop.shopId}`);
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

    let result: any = {};

    switch (type) {
      case 'listings':
        result = await syncListings(etsyAPI, shop, userId);
        break;
      case 'orders':
        result = await syncOrders(etsyAPI, shop, userId);
        break;
      case 'inventory':
        result = await syncInventory(etsyAPI, shop, userId);
        break;
      case 'all':
        const listingsResult = await syncListings(etsyAPI, shop, userId);
        const ordersResult = await syncOrders(etsyAPI, shop, userId);
        const inventoryResult = await syncInventory(etsyAPI, shop, userId);
        result = {
          listings: listingsResult,
          orders: ordersResult,
          inventory: inventoryResult,
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
    }

    // Update last sync time
    shop.lastSyncAt = new Date();
    await shop.save();

    return NextResponse.json({
      success: true,
      message: `Sync completed for ${type}`,
      result,
    });

  } catch (error: any) {
    console.error('Etsy sync error:', error);
    
    // Provide more specific error messages
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          error: 'Duplicate key error. This may occur if data is being synced simultaneously. Please try again.',
          details: error.keyValue 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Sync failed',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

async function syncListings(etsyAPI: EtsyAPI, shop: any, userId: string) {
  const listings = await etsyAPI.getListings(shop.shopId);
  let synced = 0;
  let created = 0;
  let updated = 0;
  let refreshed = 0;

  for (const listing of listings) {
    const etsyListingId = listing.listing_id.toString();
    
    // Query by etsyListingId only since it has a unique index
    // This ensures we find the listing even if userId changed
    const existingListing = await EtsyListing.findOne({ etsyListingId });

    // Check if data needs refresh per Etsy API Terms (6 hours for listings)
    const needsRefresh = !existingListing || needsEtsyDataRefresh(existingListing.lastSyncedAt, 'listing');

    // Fetch images for the listing
    let images: Array<{ url: string; rank: number; listingImageId: string }> = [];
    try {
      const listingImages = await etsyAPI.getListingImages(etsyListingId);
      images = listingImages.map((img: any, index: number) => ({
        url: img.url_fullxfull || img.url_570xN || img.url_75x75 || '',
        rank: img.rank ?? index,
        listingImageId: img.listing_image_id?.toString() || `${etsyListingId}-${index}`,
      })).filter((img: any) => img.url); // Filter out images without URLs
    } catch (error) {
      console.warn(`Failed to fetch images for listing ${etsyListingId}:`, error);
      // Use existing images if available
      if (existingListing?.images && existingListing.images.length > 0) {
        images = existingListing.images;
      }
    }

    const listingData = {
      userId,
      etsyListingId,
      shopId: shop.shopId,
      title: listing.title,
      description: listing.description,
      price: listing.price.amount / listing.price.divisor,
      currency: listing.price.currency_code,
      state: listing.state,
      tags: listing.tags,
      materials: listing.materials,
      categoryPath: listing.category_path,
      images,
      inventory: {
        quantity: listing.quantity,
      },
      views: (listing as any).views ?? 0,
      numFavorers: (listing as any).num_favorers ?? (listing as any).num_favorers ?? 0,
      lastSyncedAt: new Date(), // Always update sync timestamp
    };

    // Use findOneAndUpdate with upsert to handle both create and update atomically
    // This prevents race conditions and duplicate key errors
    const result = await EtsyListing.findOneAndUpdate(
      { etsyListingId },
      { $set: listingData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (existingListing) {
      updated++;
      if (needsRefresh) refreshed++;
    } else {
      created++;
    }
    synced++;
  }

  return { synced, created, updated, refreshed };
}

async function syncOrders(etsyAPI: EtsyAPI, shop: any, userId: string) {
  const orders = await etsyAPI.getOrders(shop.shopId);
  let synced = 0;
  let created = 0;
  let updated = 0;

  for (const order of orders) {
    const etsyOrderId = order.receipt_id.toString();
    
    // Query by etsyOrderId only since it has a unique index
    // This ensures we find the order even if userId changed
    const existingOrder = await EtsyOrder.findOne({ etsyOrderId });

    const orderData = {
      userId,
      etsyOrderId,
      shopId: shop.shopId,
      receiptId: order.receipt_id.toString(),
      // New Etsy receipts payload has buyer fields at the top level
      buyerUserId: order.buyer_user_id?.toString?.() || '',
      // Etsy sometimes omits buyer_email; use a safe fallback to satisfy schema
      buyerEmail: order.buyer_email || 'unknown',
      status: (order.status || '').toString().toLowerCase(), // e.g. "Completed"
      paymentStatus: order.is_paid ? 'paid' : 'pending',
      shippingStatus: order.is_shipped ? 'shipped' : 'pending',
      total: order.grandtotal.amount / order.grandtotal.divisor,
      currency: order.grandtotal.currency_code,
      shippingCost: order.total_shipping_cost.amount / order.total_shipping_cost.divisor,
      taxCost: order.total_tax_cost.amount / order.total_tax_cost.divisor,
      items: order.transactions.map((tx: any) => {
        const rawVariations = tx.variations || tx.selected_variations || [];
        const mappedVariations = rawVariations.map((v: any) => {
          const property =
            v.formatted_name ||
            v.property_name ||
            (v.property_id != null ? String(v.property_id) : 'Attribute');
          const value =
            v.formatted_value ||
            v.value ||
            (Array.isArray(v.values) && v.values.length ? v.values[0] : 'Value');
          return { property, value };
        });

        return {
          listingId: tx.listing_id.toString(),
          title: tx.title,
          quantity: tx.quantity,
          price: tx.price.amount / tx.price.divisor,
          variations: mappedVariations,
        };
      }),
      shippingAddress: {
        name: order.name || 'Unknown',
        address1: order.first_line || 'Unknown',
        address2: order.second_line || '',
        city: order.city || 'Unknown',
        // Mongoose requires non-empty string; use 'N/A' if Etsy omits state
        state: order.state || 'N/A',
        zip: order.zip || 'N/A',
        country: order.country_iso || 'N/A',
        phone: '', // not provided in current receipts payload
      },
      messageFromBuyer: order.message_from_buyer,
      messageFromSeller: order.message_from_seller,
      lastSyncedAt: new Date(),
    };

    // Use findOneAndUpdate with upsert to handle both create and update atomically
    // This prevents race conditions and duplicate key errors
    const result = await EtsyOrder.findOneAndUpdate(
      { etsyOrderId },
      { $set: orderData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (existingOrder) {
      updated++;
    } else {
      created++;
    }
    synced++;
  }

  return { synced, created, updated };
}

async function syncInventory(etsyAPI: EtsyAPI, shop: any, userId: string) {
  const listings = await EtsyListing.find({ userId, shopId: shop.shopId });
  let synced = 0;
  let updated = 0;

  for (const listing of listings) {
    try {
      const inventory = await etsyAPI.getListingInventory(listing.etsyListingId);

      await EtsyListing.updateOne(
        { userId, etsyListingId: listing.etsyListingId },
        {
          $set: {
            'inventory.quantity': inventory.products[0]?.offerings[0]?.quantity || 0,
            lastSyncedAt: new Date(),
          }
        }
      );
      updated++;
    } catch (error) {
      console.error(`Failed to sync inventory for listing ${listing.etsyListingId}:`, error);
    }
    synced++;
  }

  return { synced, updated };
}
