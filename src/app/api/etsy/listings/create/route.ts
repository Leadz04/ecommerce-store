import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { invalidateCache } from '@/lib/etsy-cache';
import { getCurrentUserId } from '@/lib/etsy-auth-helper';

// Helper function to download image from URL and return buffer for FormData
async function downloadImageBuffer(imageUrl: string, origin?: string): Promise<{ buffer: Buffer; filename: string }> {
  try {
    // Handle relative URLs by prepending the request origin
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('/') && origin) {
      fullUrl = `${origin}${imageUrl}`;
    }

    const response = await fetch(fullUrl);
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
    // Get authenticated user ID first
    const userId = await getCurrentUserId(request);

    const body = await request.json();
    const { shopId, listing, productImages } = body || {};

    if (!listing || typeof listing !== 'object') {
      return NextResponse.json(
        { error: 'Listing payload is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Use provided shopId or fall back to first active shop for this user
    const shopQuery = shopId
      ? { userId, shopId: String(shopId), isActive: true }
      : { userId, isActive: true };
    const shop = await EtsyShop.findOne(shopQuery);

    if (!shop) {
      return NextResponse.json(
        { error: 'Active Etsy shop not found for your account' },
        { status: 404 }
      );
    }

    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId, shop.refreshToken, async (newTokens) => {
      // Update tokens using updateOne to avoid validation issues
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
      // Also update the local shop object for potential reuse
      shop.accessToken = newTokens.access_token;
      if (newTokens.refresh_token) {
        shop.refreshToken = newTokens.refresh_token;
      }
      shop.tokenExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    });

    // For physical products, ensure shipping_profile_id is set if provided
    // Note: Etsy requires shipping_profile_id for physical listings
    if (!listing.is_digital && listing.shipping_profile_id) {
      listing.shipping_profile_id = Number(listing.shipping_profile_id);
    }

    // Convert price from object format to simple number if needed
    let priceValue: number;
    if (typeof listing.price === 'object' && listing.price.amount && listing.price.divisor) {
      priceValue = listing.price.amount / listing.price.divisor;
    } else if (typeof listing.price === 'number') {
      priceValue = listing.price;
    } else {
      priceValue = 0;
    }

    // Always force draft state for safety
    const listingData: any = {
      ...listing,
      price: priceValue, // Convert to simple float
      state: 'draft',
      type: listing.is_digital ? 'download' : 'physical', // Set listing type
    };

    // For physical products, ensure readiness_state_id is set
    if (!listing.is_digital && !listingData.readiness_state_id) {
      try {
        const readinessStateId = await etsyAPI.getOrCreateReadinessState(shop.shopId);
        listingData.readiness_state_id = readinessStateId;
      } catch (err) {
        console.warn('Failed to get/create readiness state:', err);
      }
    }

    // For physical products, ensure shipping_profile_id is set
    if (!listing.is_digital && !listingData.shipping_profile_id) {
      try {
        const profiles = await etsyAPI.getShippingProfiles(shop.shopId);
        if (profiles && profiles.length > 0) {
          listingData.shipping_profile_id = profiles[0].shipping_profile_id;
          console.log(`[Create Listing] Using default shipping profile: ${listingData.shipping_profile_id}`);
        } else {
          throw new Error('No shipping profiles found for this shop. Please create one on Etsy first.');
        }
      } catch (err: any) {
        console.warn('Failed to get default shipping profile:', err);
        if (err.message?.includes('No shipping profiles')) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        // If it's a generic failure, we still try, but Etsy will likely reject it
      }
    }

    const created = await etsyAPI.createListing(shop.shopId, listingData);
    const listingId = created.listing_id.toString();

    // Update inventory with size variations if provided
    if (listing.inventory && listing.inventory.products && listing.inventory.products.length > 0) {
      try {
        console.log('[Create Listing] Setting inventory with variations:', listing.inventory);
        await etsyAPI.updateListingInventory(listingId, listing.inventory);
        console.log('[Create Listing] Inventory updated successfully');
      } catch (inventoryError: any) {
        console.error('[Create Listing] Failed to set inventory:', inventoryError);
        // Don't fail the entire request - listing is created, inventory can be set later
      }
    }

    // Upload images if provided
    const uploadedImages: any[] = [];
    if (productImages && Array.isArray(productImages) && productImages.length > 0) {
      try {
        // Upload up to 20 images (Etsy limit)
        const imagesToUpload = productImages.slice(0, 20);

        for (let i = 0; i < imagesToUpload.length; i++) {
          const imageUrl = imagesToUpload[i];
          if (!imageUrl || typeof imageUrl !== 'string') continue;

          try {
            // Download image and create FormData
            const origin = request.nextUrl.origin;
            const { buffer, filename } = await downloadImageBuffer(imageUrl, origin);
            const formData = new FormData();

            // Append buffer directly to FormData (Node.js 18+ supports File/Blob-like objects)
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
      } catch (error: any) {
        console.error('Error uploading images:', error);
        // Don't fail the entire request if images fail to upload
        // The listing is already created
      }
    }

    // Save to our database
    try {
      const dbListing = new EtsyListing({
        userId: shop.userId,
        etsyListingId: listingId,
        shopId: shop.shopId,
        title: created.title || listing.title,
        description: created.description || listing.description,
        price: created.price ? (typeof created.price === 'object' ? (created.price as any).amount / (created.price as any).divisor : created.price) : (typeof listing.price === 'object' ? (listing.price as any).amount / (listing.price as any).divisor : listing.price || 0),
        currency: (created.price && typeof created.price === 'object' && (created.price as any).currency_code) || (listing.price && typeof listing.price === 'object' && (listing.price as any).currency_code) || 'USD',
        state: created.state || 'draft',
        tags: created.tags || listing.tags || [],
        materials: created.materials || listing.materials || [],
        categoryPath: created.category_path || [],
        images: uploadedImages.map((img, idx) => ({
          url: img.url_fullxfull || img.url_570xN || img.url_75x75 || productImages[idx] || '',
          rank: img.rank || idx + 1,
          listingImageId: img.listing_image_id?.toString() || `${listingId}-${idx}`,
        })),
        inventory: {
          quantity: created.quantity || listing.quantity || 1,
        },
        lastSyncedAt: new Date(),
      });
      await dbListing.save();

      // Invalidate shop listings cache
      try {
        await invalidateCache(userId, { shopId: shop.shopId, cacheKeyPattern: 'shop-listings' });
      } catch (err) {
        console.warn('Failed to invalidate cache:', err);
      }
    } catch (dbError: any) {
      console.error('Failed to save listing to database:', dbError);
      // Don't fail the request if DB save fails - listing is already on Etsy
    }

    return NextResponse.json({
      success: true,
      listing: created,
      imagesUploaded: uploadedImages.length,
      totalImages: productImages?.length || 0,
    });
  } catch (error: any) {
    console.error('Failed to create Etsy listing:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create listing' },
      { status: 500 }
    );
  }
}


