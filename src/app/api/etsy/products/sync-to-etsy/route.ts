import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing, Product } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId } from '@/lib/etsy-auth-helper';

// Helper function to download image from URL and return buffer for FormData
async function downloadImageBuffer(imageUrl: string): Promise<{ buffer: Buffer; filename: string }> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract filename from URL or use default
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0] || `image.jpg`;

    return { buffer, filename };
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID from request
    const userId = await getCurrentUserId(request);
    const { productId, shopId, action = 'create' } = await request.json();

    if (!productId || !shopId) {
      return NextResponse.json(
        { error: 'productId and shopId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Find shop belonging to this user (validate ownership)
    const shop = await EtsyShop.findOne({ userId, shopId: String(shopId), isActive: true });
    if (!shop) {
      return NextResponse.json({ error: 'Etsy shop not found, inactive, or access denied' }, { status: 404 });
    }

    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId, shop.refreshToken, async (newTokens) => {
      // Update tokens using updateOne to avoid validation issues
      await EtsyShop.updateOne(
        { userId, shopId: shop.shopId },
        {
          $set: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
          }
        }
      );
      // Also update the local shop object for potential reuse
      shop.accessToken = newTokens.access_token;
      if (newTokens.refresh_token) {
        shop.refreshToken = newTokens.refresh_token;
      }
      shop.tokenExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    });

    let result: any = {};

    switch (action) {
      case 'create':
        result = await createEtsyListing(etsyAPI, product, shop, userId);
        break;
      case 'update':
        result = await updateEtsyListing(etsyAPI, product, shop, userId);
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

  } catch (error: any) {
    console.error('Etsy product sync error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Product sync failed',
        details: error?.response?.data || error?.stack
      },
      { status: 500 }
    );
  }
}

async function createEtsyListing(etsyAPI: EtsyAPI, product: any, shop: any, userId: string) {
  // Extract materials from specifications
  const materials: string[] = [];
  if (product.specifications) {
    const materialKeys = ['Material', 'material', 'Materials', 'materials', 'Fabric', 'fabric', 'Composition', 'composition'];
    for (const key of materialKeys) {
      if (product.specifications[key]) {
        const materialValue = product.specifications[key];
        // Split by comma if it's a string with multiple materials
        if (typeof materialValue === 'string') {
          materials.push(...materialValue.split(',').map(m => m.trim()).filter(Boolean));
        } else {
          materials.push(String(materialValue));
        }
      }
    }
  }

  // Fetch shipping profiles - required for physical listings
  let shippingProfileId: number | undefined;
  try {
    const shippingProfiles = await etsyAPI.getShippingProfiles(shop.shopId);
    if (shippingProfiles && shippingProfiles.length > 0) {
      // Use the first non-deleted shipping profile
      const activeProfile = shippingProfiles.find((p: any) => !p.is_deleted);
      if (activeProfile) {
        shippingProfileId = activeProfile.shipping_profile_id;
      } else if (shippingProfiles[0]) {
        // Fallback to first profile even if deleted (some shops might only have deleted ones)
        shippingProfileId = shippingProfiles[0].shipping_profile_id;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch shipping profiles:', error);
    // Continue without shipping profile - will fail with clear error message
  }

  if (!shippingProfileId) {
    throw new Error('No shipping profile found for this shop. Please create a shipping profile in your Etsy shop settings before creating listings.');
  }

  // Fetch or create readiness state definition - required for physical listings
  // readiness_state: 1 = ready_to_ship, 2 = made_to_order
  let readinessStateId: number | undefined;
  try {
    const readinessStates = await etsyAPI.getReadinessStateDefinitions(shop.shopId);
    // Since we're using 'made_to_order', look for readiness_state = 2
    const madeToOrderState = readinessStates?.find((r: any) => r.readiness_state === 2);

    if (madeToOrderState) {
      readinessStateId = madeToOrderState.readiness_state_id;
    } else if (readinessStates && readinessStates.length > 0) {
      // Use first available state if no made_to_order found
      readinessStateId = readinessStates[0].readiness_state_id;
    } else {
      // Create a default made_to_order readiness state definition
      // Default processing time: 1-3 days for made_to_order
      const newState = await etsyAPI.createReadinessStateDefinition(shop.shopId, 2, 1, 3);
      readinessStateId = newState.readiness_state_id;
    }
  } catch (error: any) {
    // If creation fails (e.g., conflict - definition already exists), try to fetch again
    if (error?.message?.includes('Conflict') || error?.message?.includes('409')) {
      try {
        const readinessStates = await etsyAPI.getReadinessStateDefinitions(shop.shopId);
        const madeToOrderState = readinessStates?.find((r: any) => r.readiness_state === 2);
        if (madeToOrderState) {
          readinessStateId = madeToOrderState.readiness_state_id;
        } else if (readinessStates && readinessStates.length > 0) {
          readinessStateId = readinessStates[0].readiness_state_id;
        }
      } catch (retryError) {
        console.warn('Failed to fetch readiness states after conflict:', retryError);
      }
    }

    if (!readinessStateId) {
      console.warn('Failed to get/create readiness state definition:', error);
      throw new Error('Failed to get or create readiness state definition. Please create a processing profile in your Etsy shop settings.');
    }
  }

  if (!readinessStateId) {
    throw new Error('No readiness state definition found for this shop. Please create a processing profile in your Etsy shop settings before creating listings.');
  }

  // Map our product to Etsy listing format
  // Note: taxonomy_id is required by Etsy API - using a default for clothing/apparel
  // Users should set this properly via the Create Listing form
  const listingData: any = {
    title: product.name || 'Untitled Product',
    description: product.description || product.descriptionHtml || '',
    state: 'draft' as const,
    type: 'physical' as const, // All products are physical
    price: product.price || 0, // Simple float value (Etsy API expects float, not object)
    quantity: product.stockCount || product.inventory || 1,
    tags: [], // Tags removed as per request to avoid validation errors
    materials: materials.length > 0 ? materials : [],
    taxonomy_id: 691, // Default: Clothing/Apparel (users should customize this)
    who_made: 'i_did' as const,
    when_made: 'made_to_order' as const,
    is_supply: false,
    is_customizable: true,
    is_digital: false,
    has_variations: product.variants && product.variants.length > 0,
    should_auto_renew: true,
    language: 'en' as const,
    is_private: false,
    shipping_profile_id: shippingProfileId, // Required for physical listings
    readiness_state_id: readinessStateId, // Required for physical listings
  };

  try {
    const etsyListing = await etsyAPI.createListing(shop.shopId, listingData);
    const listingId = etsyListing.listing_id.toString();

    // Upload product images
    const uploadedImages: any[] = [];
    const productImages: string[] = [];

    // Collect all product images
    if (product.image) {
      productImages.push(product.image);
    }
    if (product.images && Array.isArray(product.images)) {
      productImages.push(...product.images);
    }

    // Upload up to 20 images (Etsy limit)
    if (productImages.length > 0) {
      const imagesToUpload = productImages.slice(0, 20);

      for (let i = 0; i < imagesToUpload.length; i++) {
        const imageUrl = imagesToUpload[i];
        if (!imageUrl || typeof imageUrl !== 'string') continue;

        try {
          // Download image and create FormData
          const { buffer, filename } = await downloadImageBuffer(imageUrl);
          const formData = new FormData();

          // Create a File-like object from buffer
          const file = new File([buffer as any], filename, { type: 'image/jpeg' });
          formData.append('image', file);
          formData.append('rank', (i + 1).toString());

          const uploadedImage = await etsyAPI.uploadListingImage(listingId, formData);
          uploadedImages.push(uploadedImage);

          // Small delay between uploads to avoid rate limiting
          if (i < imagesToUpload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (imageError: any) {
          console.error(`Failed to upload image ${i + 1} (${imageUrl}):`, imageError);
          // Continue with other images even if one fails
        }
      }
    }

    // Save to our database
    const listing = new EtsyListing({
      userId: String(userId), // Use authenticated user ID
      etsyListingId: listingId,
      shopId: String(shop.shopId),
      productId: product._id?.toString(),
      title: etsyListing.title || product.name,
      description: etsyListing.description || product.description || '',
      price: typeof etsyListing.price === 'object' && etsyListing.price?.amount
        ? (etsyListing.price.amount / etsyListing.price.divisor)
        : (typeof etsyListing.price === 'number' ? etsyListing.price : product.price || 0),
      currency: (typeof etsyListing.price === 'object' && etsyListing.price?.currency_code) || 'USD',
      state: etsyListing.state || 'draft',
      tags: [], // Always empty tags as requested
      materials: etsyListing.materials || materials,
      categoryPath: etsyListing.category_path || [],
      images: uploadedImages.length > 0 ? uploadedImages.map((img, idx) => ({
        url: img.url_fullxfull || img.url_570xN || img.url_75x75 || productImages[idx] || '',
        rank: img.rank || idx + 1,
        listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
      })) : [],
      inventory: {
        quantity: etsyListing.quantity || product.stockCount || 1,
      },
      lastSyncedAt: new Date(),
    });

    await listing.save();

    // Update Product model with Etsy Listing ID
    await Product.findByIdAndUpdate(product._id, {
      etsyListingId: listingId,
      etsyExported: true,
      etsyExportedAt: new Date(),
    });

    return {
      success: true,
      etsyListingId: etsyListing.listing_id,
      listingId: listing._id,
      imagesUploaded: uploadedImages.length,
    };
  } catch (error: any) {
    console.error('Failed to create Etsy listing:', error);
    throw new Error(error?.message || 'Failed to create Etsy listing');
  }
}

async function updateEtsyListing(etsyAPI: EtsyAPI, product: any, shop: any, userId: string) {
  const existingListing = await EtsyListing.findOne({
    productId: product._id,
    shopId: shop.shopId
  });

  if (!existingListing) {
    throw new Error('No Etsy listing found for this product. Create a listing first.');
  }

  // Extract materials from specifications
  const materials: string[] = [];
  if (product.specifications) {
    const materialKeys = ['Material', 'material', 'Materials', 'materials', 'Fabric', 'fabric', 'Composition', 'composition'];
    for (const key of materialKeys) {
      if (product.specifications[key]) {
        const materialValue = product.specifications[key];
        if (typeof materialValue === 'string') {
          materials.push(...materialValue.split(',').map(m => m.trim()).filter(Boolean));
        } else {
          materials.push(String(materialValue));
        }
      }
    }
  }

  const listingData: any = {
    title: product.name || existingListing.title,
    description: product.description || product.descriptionHtml || existingListing.description,
    price: product.price || existingListing.price || 0, // Simple float value
    quantity: product.stockCount || product.inventory || existingListing.inventory?.quantity || 1,
    tags: [], // Tags removed as per request
    materials: materials.length > 0 ? materials : existingListing.materials || [],
  };

  try {
    const etsyListing = await etsyAPI.updateListing(existingListing.etsyListingId, listingData);

    // Update images if product has new images
    const productImages: string[] = [];
    if (product.image) productImages.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      productImages.push(...product.images);
    }

    // Only update images if product has images and they're different
    const uploadedImages: any[] = [];
    if (productImages.length > 0) {
      // Get current listing images from Etsy
      let currentImages: any[] = [];
      try {
        currentImages = await etsyAPI.getListingImages(existingListing.etsyListingId);
      } catch (err) {
        console.warn('Failed to fetch current listing images:', err);
      }

      // Only upload if we have new images or different images
      const currentImageUrls = currentImages.map(img => img.url_fullxfull || img.url_570xN || '').filter(Boolean);
      const hasNewImages = productImages.some(img => !currentImageUrls.includes(img));

      if (hasNewImages) {
        const imagesToUpload = productImages.slice(0, 20);
        for (let i = 0; i < imagesToUpload.length; i++) {
          const imageUrl = imagesToUpload[i];
          if (!imageUrl || typeof imageUrl !== 'string') continue;

          try {
            const { buffer, filename } = await downloadImageBuffer(imageUrl);
            const formData = new FormData();
            const file = new File([buffer as any], filename, { type: 'image/jpeg' });
            formData.append('image', file);
            formData.append('rank', (i + 1).toString());

            const uploadedImage = await etsyAPI.uploadListingImage(existingListing.etsyListingId, formData);
            uploadedImages.push(uploadedImage);

            if (i < imagesToUpload.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (imageError: any) {
            console.error(`Failed to upload image ${i + 1}:`, imageError);
          }
        }
      }
    }

    // Update our database
    const updateData: any = {
      title: etsyListing.title,
      description: etsyListing.description,
      price: typeof etsyListing.price === 'object' && etsyListing.price?.amount
        ? (etsyListing.price.amount / etsyListing.price.divisor)
        : (typeof etsyListing.price === 'number' ? etsyListing.price : existingListing.price),
      tags: [], // Tags removed
      materials: etsyListing.materials || [],
      'inventory.quantity': etsyListing.quantity,
      lastSyncedAt: new Date(),
    };

    // Update images if we uploaded new ones
    if (uploadedImages.length > 0) {
      updateData.images = uploadedImages.map((img, idx) => ({
        url: img.url_fullxfull || img.url_570xN || img.url_75x75 || productImages[idx] || '',
        rank: img.rank || idx + 1,
        listingImageId: img.listing_image_id?.toString() || `${existingListing.etsyListingId}-${idx}`,
      }));
    }

    await EtsyListing.updateOne(
      { etsyListingId: existingListing.etsyListingId },
      { $set: updateData }
    );

    // Ensure Product model has the listing ID (useful for migration/consistency)
    await Product.findByIdAndUpdate(product._id, {
      etsyListingId: existingListing.etsyListingId,
      etsyExported: true,
      etsyExportedAt: new Date(),
    });

    return {
      success: true,
      etsyListingId: etsyListing.listing_id,
      listingId: existingListing._id,
      imagesUploaded: uploadedImages.length,
    };
  } catch (error: any) {
    console.error('Failed to update Etsy listing:', error);
    throw new Error(error?.message || 'Failed to update Etsy listing');
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
