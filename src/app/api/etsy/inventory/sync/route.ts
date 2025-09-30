import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, Product } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

export async function POST(request: NextRequest) {
  try {
    const { shopId, direction = 'both' } = await request.json();

    await connectDB();

    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId);

    let result: any = {};

    switch (direction) {
      case 'to-etsy':
        result = await syncInventoryToEtsy(etsyAPI, shop);
        break;
      case 'from-etsy':
        result = await syncInventoryFromEtsy(etsyAPI, shop);
        break;
      case 'both':
        const toEtsyResult = await syncInventoryToEtsy(etsyAPI, shop);
        const fromEtsyResult = await syncInventoryFromEtsy(etsyAPI, shop);
        result = {
          toEtsy: toEtsyResult,
          fromEtsy: fromEtsyResult,
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid sync direction' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Inventory sync completed (${direction})`,
      result,
    });

  } catch (error) {
    console.error('Inventory sync error:', error);
    return NextResponse.json(
      { error: 'Inventory sync failed' },
      { status: 500 }
    );
  }
}

async function syncInventoryToEtsy(etsyAPI: EtsyAPI, shop: any) {
  // Get all products that have Etsy listings
  const listings = await EtsyListing.find({ shopId: shop.shopId }).populate('productId');
  let synced = 0;
  let updated = 0;
  let errors = 0;

  for (const listing of listings) {
    if (!listing.productId) continue;

    const product = listing.productId as any;
    const newQuantity = product.stockCount || 0;

    try {
      // Update inventory on Etsy
      const inventoryData = {
        products: [{
          sku: product.sku || `SKU-${product._id}`,
          offerings: [{
            quantity: newQuantity,
            is_enabled: newQuantity > 0,
          }]
        }]
      };

      await etsyAPI.updateListingInventory(listing.etsyListingId, inventoryData);

      // Update our local record
      await EtsyListing.updateOne(
        { etsyListingId: listing.etsyListingId },
        { 
          $set: { 
            'inventory.quantity': newQuantity,
            lastSyncedAt: new Date(),
          }
        }
      );

      updated++;
    } catch (error) {
      console.error(`Failed to sync inventory for listing ${listing.etsyListingId}:`, error);
      errors++;
    }
    synced++;
  }

  return { synced, updated, errors };
}

async function syncInventoryFromEtsy(etsyAPI: EtsyAPI, shop: any) {
  // Get all Etsy listings
  const listings = await EtsyListing.find({ shopId: shop.shopId }).populate('productId');
  let synced = 0;
  let updated = 0;
  let errors = 0;

  for (const listing of listings) {
    if (!listing.productId) continue;

    const product = listing.productId as any;

    try {
      // Get current inventory from Etsy
      const inventory = await etsyAPI.getListingInventory(listing.etsyListingId);
      const etsyQuantity = inventory.products[0]?.offerings[0]?.quantity || 0;

      // Update our product stock
      await Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            stockCount: etsyQuantity,
            inStock: etsyQuantity > 0,
            updatedAt: new Date(),
          }
        }
      );

      // Update our listing record
      await EtsyListing.updateOne(
        { etsyListingId: listing.etsyListingId },
        { 
          $set: { 
            'inventory.quantity': etsyQuantity,
            lastSyncedAt: new Date(),
          }
        }
      );

      updated++;
    } catch (error) {
      console.error(`Failed to sync inventory from Etsy for listing ${listing.etsyListingId}:`, error);
      errors++;
    }
    synced++;
  }

  return { synced, updated, errors };
}
