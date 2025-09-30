import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, EtsyOrder, Product } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

export async function POST(request: NextRequest) {
  try {
    const { type, shopId } = await request.json();

    await connectDB();

    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId);

    let result: any = {};

    switch (type) {
      case 'listings':
        result = await syncListings(etsyAPI, shop);
        break;
      case 'orders':
        result = await syncOrders(etsyAPI, shop);
        break;
      case 'inventory':
        result = await syncInventory(etsyAPI, shop);
        break;
      case 'all':
        const listingsResult = await syncListings(etsyAPI, shop);
        const ordersResult = await syncOrders(etsyAPI, shop);
        const inventoryResult = await syncInventory(etsyAPI, shop);
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

  } catch (error) {
    console.error('Etsy sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

async function syncListings(etsyAPI: EtsyAPI, shop: any) {
  const listings = await etsyAPI.getListings(shop.shopId);
  let synced = 0;
  let created = 0;
  let updated = 0;

  for (const listing of listings) {
    const existingListing = await EtsyListing.findOne({ etsyListingId: listing.listing_id.toString() });
    
    const listingData = {
      etsyListingId: listing.listing_id.toString(),
      shopId: shop.shopId,
      title: listing.title,
      description: listing.description,
      price: listing.price.amount / listing.price.divisor,
      currency: listing.price.currency_code,
      state: listing.state,
      tags: listing.tags,
      materials: listing.materials,
      categoryPath: listing.category_path,
      inventory: {
        quantity: listing.quantity,
      },
      lastSyncedAt: new Date(),
    };

    if (existingListing) {
      await EtsyListing.updateOne(
        { etsyListingId: listing.listing_id.toString() },
        { $set: listingData }
      );
      updated++;
    } else {
      await EtsyListing.create(listingData);
      created++;
    }
    synced++;
  }

  return { synced, created, updated };
}

async function syncOrders(etsyAPI: EtsyAPI, shop: any) {
  const orders = await etsyAPI.getOrders(shop.shopId);
  let synced = 0;
  let created = 0;
  let updated = 0;

  for (const order of orders) {
    const existingOrder = await EtsyOrder.findOne({ etsyOrderId: order.receipt_id.toString() });
    
    const orderData = {
      etsyOrderId: order.receipt_id.toString(),
      shopId: shop.shopId,
      receiptId: order.receipt_id.toString(),
      buyerUserId: order.buyer.user_id.toString(),
      buyerEmail: order.buyer.login_name, // Etsy doesn't provide email in API
      status: order.status,
      paymentStatus: order.payment_status,
      shippingStatus: order.shipping_status,
      total: order.grandtotal.amount / order.grandtotal.divisor,
      currency: order.grandtotal.currency_code,
      shippingCost: order.total_shipping_cost.amount / order.total_shipping_cost.divisor,
      taxCost: order.total_tax_cost.amount / order.total_tax_cost.divisor,
      items: order.transactions.map((tx: any) => ({
        listingId: tx.listing_id.toString(),
        title: tx.title,
        quantity: tx.quantity,
        price: tx.price.amount / tx.price.divisor,
        variations: tx.selected_variations || [],
      })),
      shippingAddress: {
        name: `${order.buyer.first_name} ${order.buyer.last_name}`,
        address1: order.shipping_address?.first_line || '',
        address2: order.shipping_address?.second_line || '',
        city: order.shipping_address?.city || '',
        state: order.shipping_address?.state || '',
        zip: order.shipping_address?.zip || '',
        country: order.shipping_address?.country_iso || '',
        phone: order.shipping_address?.phone || '',
      },
      messageFromBuyer: order.message_from_buyer,
      messageFromSeller: order.message_from_seller,
      lastSyncedAt: new Date(),
    };

    if (existingOrder) {
      await EtsyOrder.updateOne(
        { etsyOrderId: order.receipt_id.toString() },
        { $set: orderData }
      );
      updated++;
    } else {
      await EtsyOrder.create(orderData);
      created++;
    }
    synced++;
  }

  return { synced, created, updated };
}

async function syncInventory(etsyAPI: EtsyAPI, shop: any) {
  const listings = await EtsyListing.find({ shopId: shop.shopId });
  let synced = 0;
  let updated = 0;

  for (const listing of listings) {
    try {
      const inventory = await etsyAPI.getListingInventory(listing.etsyListingId);
      
      await EtsyListing.updateOne(
        { etsyListingId: listing.etsyListingId },
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
