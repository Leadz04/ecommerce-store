import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, Product } from '@/models';
import { EtsyAPI } from '@/lib/etsy';

export async function POST(request: NextRequest) {
  try {
    const { productId, shopId, action = 'create' } = await request.json();

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const shop = await EtsyShop.findOne({ shopId, isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Etsy shop not found or inactive' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId);

    let result: any = {};

    switch (action) {
      case 'create':
        result = await createEtsyListing(etsyAPI, product, shop);
        break;
      case 'update':
        result = await updateEtsyListing(etsyAPI, product, shop);
        break;
      case 'delete':
        result = await deleteEtsyListing(etsyAPI, product, shop);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Product ${action} completed`,
      result,
    });

  } catch (error) {
    console.error('Etsy product sync error:', error);
    return NextResponse.json(
      { error: 'Product sync failed' },
      { status: 500 }
    );
  }
}

async function createEtsyListing(etsyAPI: EtsyAPI, product: any, shop: any) {
  // Map our product to Etsy listing format
  const listingData = {
    title: product.name,
    description: product.description,
    price: Math.round(product.price * 100), // Convert to cents
    quantity: product.stockCount || 1,
    tags: product.tags || [],
    materials: product.specifications?.materials || [],
    who_made: 'i_did',
    when_made: 'made_to_order',
    is_supply: false,
    is_customizable: true,
    is_digital: false,
    has_variations: product.variants && product.variants.length > 0,
    should_auto_renew: true,
    language: 'en',
    is_private: false,
  };

  try {
    const etsyListing = await etsyAPI.createListing(shop.shopId, listingData);
    
    // Save to our database
    const listing = new EtsyListing({
      etsyListingId: etsyListing.listing_id.toString(),
      shopId: shop.shopId,
      productId: product._id,
      title: etsyListing.title,
      description: etsyListing.description,
      price: etsyListing.price.amount / etsyListing.price.divisor,
      currency: etsyListing.price.currency_code,
      state: etsyListing.state,
      tags: etsyListing.tags,
      materials: etsyListing.materials,
      categoryPath: etsyListing.category_path,
      inventory: {
        quantity: etsyListing.quantity,
      },
      lastSyncedAt: new Date(),
    });

    await listing.save();

    return {
      success: true,
      etsyListingId: etsyListing.listing_id,
      listingId: listing._id,
    };
  } catch (error) {
    console.error('Failed to create Etsy listing:', error);
    throw error;
  }
}

async function updateEtsyListing(etsyAPI: EtsyAPI, product: any, shop: any) {
  const existingListing = await EtsyListing.findOne({ 
    productId: product._id, 
    shopId: shop.shopId 
  });

  if (!existingListing) {
    throw new Error('No Etsy listing found for this product');
  }

  const listingData = {
    title: product.name,
    description: product.description,
    price: Math.round(product.price * 100), // Convert to cents
    quantity: product.stockCount || 1,
    tags: product.tags || [],
    materials: product.specifications?.materials || [],
  };

  try {
    const etsyListing = await etsyAPI.updateListing(existingListing.etsyListingId, listingData);
    
    // Update our database
    await EtsyListing.updateOne(
      { etsyListingId: existingListing.etsyListingId },
      {
        $set: {
          title: etsyListing.title,
          description: etsyListing.description,
          price: etsyListing.price.amount / etsyListing.price.divisor,
          tags: etsyListing.tags,
          materials: etsyListing.materials,
          'inventory.quantity': etsyListing.quantity,
          lastSyncedAt: new Date(),
        }
      }
    );

    return {
      success: true,
      etsyListingId: etsyListing.listing_id,
      listingId: existingListing._id,
    };
  } catch (error) {
    console.error('Failed to update Etsy listing:', error);
    throw error;
  }
}

async function deleteEtsyListing(etsyAPI: EtsyAPI, product: any, shop: any) {
  const existingListing = await EtsyListing.findOne({ 
    productId: product._id, 
    shopId: shop.shopId 
  });

  if (!existingListing) {
    throw new Error('No Etsy listing found for this product');
  }

  try {
    await etsyAPI.deleteListing(existingListing.etsyListingId);
    
    // Remove from our database
    await EtsyListing.deleteOne({ etsyListingId: existingListing.etsyListingId });

    return {
      success: true,
      etsyListingId: existingListing.etsyListingId,
    };
  } catch (error) {
    console.error('Failed to delete Etsy listing:', error);
    throw error;
  }
}
