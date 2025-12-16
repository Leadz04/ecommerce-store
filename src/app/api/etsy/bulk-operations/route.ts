import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyListing } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { needsEtsyDataRefresh } from '@/lib/etsy-compliance';

interface BulkOperationRequest {
  shopId: string;
  listingIds: string[];
  operations: {
    type: 'price' | 'quantity' | 'tags' | 'processing_time' | 'shipping_template';
    action: 'set' | 'increase' | 'decrease' | 'add' | 'remove' | 'replace';
    value: any;
    value2?: any; // For replace operations
  }[];
  preview?: boolean; // If true, only return preview without applying
}

interface PreviewResult {
  listing_id: string;
  title: string;
  current: any;
  updated: any;
  changes: string[];
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body: BulkOperationRequest = await request.json();
    const { shopId, listingIds, operations, preview: previewMode = false } = body;

    if (!shopId || !listingIds || listingIds.length === 0 || !operations || operations.length === 0) {
      return NextResponse.json(
        { error: 'shopId, listingIds, and operations are required' },
        { status: 400 }
      );
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

    const results: PreviewResult[] = [];
    const errors: { listing_id: string; error: string }[] = [];

    // Fetch all listings from DB first, then API if needed
    const listings = await Promise.all(
      listingIds.map(async (id) => {
        try {
          // Check DB first
          const dbListing = await EtsyListing.findOne({ etsyListingId: id }).lean();
          const needsRefresh = !dbListing || needsEtsyDataRefresh(dbListing.lastSyncedAt, 'listing');
          
          if (!needsRefresh && dbListing) {
            // Use DB data, transform to match API format
            return {
              listing_id: parseInt(id),
              title: dbListing.title || '',
              description: dbListing.description || '',
              price: {
                amount: Math.round(dbListing.price * 100),
                divisor: 100,
                currency_code: dbListing.currency || 'USD',
              },
              quantity: dbListing.inventory?.quantity || 0,
              tags: dbListing.tags || [],
              materials: dbListing.materials || [],
              category_path: dbListing.categoryPath || [],
              state: dbListing.state,
              processing_min: 1,
              processing_max: 7,
              shipping_template_id: undefined,
            };
          } else {
            // Fetch from API and update DB
            const listing = await etsyAPI.getListing(id);
            
            // Update DB
            await EtsyListing.findOneAndUpdate(
              { etsyListingId: id },
              {
                $set: {
                  userId: shop.userId,
                  shopId: shop.shopId,
                  etsyListingId: id,
                  title: listing.title,
                  description: listing.description,
                  price: listing.price.amount / listing.price.divisor,
                  currency: listing.price.currency_code,
                  state: listing.state,
                  tags: listing.tags || [],
                  materials: listing.materials || [],
                  categoryPath: listing.category_path || [],
                  inventory: { quantity: listing.quantity || 0 },
                  views: listing.views || 0,
                  numFavorers: listing.num_favorers || 0,
                  lastSyncedAt: new Date(),
                }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            
            return listing;
          }
        } catch (error: any) {
          errors.push({ listing_id: id, error: error.message });
          return null;
        }
      })
    );

    const validListings = listings.filter(Boolean);

    // Process each listing
    for (const listing of validListings) {
      if (!listing) continue;

      const preview: PreviewResult = {
        listing_id: listing.listing_id.toString(),
        title: listing.title,
        current: {},
        updated: {},
        changes: [],
      };

      const updateData: any = {};

      // Apply each operation
      for (const op of operations) {
        switch (op.type) {
          case 'price':
            const currentPrice = listing.price.amount / listing.price.divisor;
            let newPrice = currentPrice;

            if (op.action === 'set') {
              newPrice = parseFloat(op.value);
            } else if (op.action === 'increase') {
              if (typeof op.value === 'number') {
                newPrice = currentPrice + op.value;
              } else if (op.value.toString().endsWith('%')) {
                const percent = parseFloat(op.value.toString().replace('%', ''));
                newPrice = currentPrice * (1 + percent / 100);
              }
            } else if (op.action === 'decrease') {
              if (typeof op.value === 'number') {
                newPrice = currentPrice - op.value;
              } else if (op.value.toString().endsWith('%')) {
                const percent = parseFloat(op.value.toString().replace('%', ''));
                newPrice = currentPrice * (1 - percent / 100);
              }
            }

            newPrice = Math.max(0.01, newPrice); // Ensure minimum price
            const newPriceInCents = Math.round(newPrice * listing.price.divisor);

            preview.current.price = currentPrice.toFixed(2);
            preview.updated.price = newPrice.toFixed(2);
            preview.changes.push(`Price: $${currentPrice.toFixed(2)} → $${newPrice.toFixed(2)}`);

            updateData.price = {
              amount: newPriceInCents,
              divisor: listing.price.divisor,
              currency_code: listing.price.currency_code,
            };
            break;

          case 'quantity':
            const currentQuantity = listing.quantity || 0;
            let newQuantity = currentQuantity;

            if (op.action === 'set') {
              newQuantity = parseInt(op.value);
            } else if (op.action === 'increase') {
              newQuantity = currentQuantity + parseInt(op.value);
            } else if (op.action === 'decrease') {
              newQuantity = Math.max(0, currentQuantity - parseInt(op.value));
            }

            preview.current.quantity = currentQuantity;
            preview.updated.quantity = newQuantity;
            preview.changes.push(`Quantity: ${currentQuantity} → ${newQuantity}`);

            updateData.quantity = newQuantity;
            break;

          case 'tags':
            const currentTags = listing.tags || [];
            let newTags = [...currentTags];

            if (op.action === 'set') {
              newTags = Array.isArray(op.value) ? op.value : op.value.split(',').map((t: string) => t.trim());
            } else if (op.action === 'add') {
              const tagsToAdd = Array.isArray(op.value) ? op.value : op.value.split(',').map((t: string) => t.trim());
              tagsToAdd.forEach((tag: string) => {
                if (!newTags.includes(tag) && tag.length > 0) {
                  newTags.push(tag);
                }
              });
            } else if (op.action === 'remove') {
              const tagsToRemove = Array.isArray(op.value) ? op.value : op.value.split(',').map((t: string) => t.trim());
              newTags = newTags.filter((tag) => !tagsToRemove.includes(tag));
            } else if (op.action === 'replace') {
              const oldTag = op.value?.trim();
              const newTag = op.value2?.trim();
              newTags = newTags.map((tag) => (tag === oldTag ? newTag : tag)).filter(Boolean);
            }

            // Limit to 13 tags (Etsy's limit)
            newTags = newTags.slice(0, 13);

            preview.current.tags = currentTags.join(', ');
            preview.updated.tags = newTags.join(', ');
            preview.changes.push(`Tags: ${currentTags.length} → ${newTags.length} tags`);

            updateData.tags = newTags;
            break;

          case 'processing_time':
            const currentMin = listing.processing_min || 1;
            const currentMax = listing.processing_max || 1;

            if (op.action === 'set') {
              const times = op.value.split('-').map((t: string) => parseInt(t.trim()));
              updateData.processing_min = times[0] || currentMin;
              updateData.processing_max = times[1] || times[0] || currentMax;

              preview.current.processing_time = `${currentMin}-${currentMax} days`;
              preview.updated.processing_time = `${updateData.processing_min}-${updateData.processing_max} days`;
              preview.changes.push(`Processing: ${preview.current.processing_time} → ${preview.updated.processing_time}`);
            }
            break;

          case 'shipping_template':
            if (op.action === 'set') {
              updateData.shipping_template_id = parseInt(op.value);
              preview.current.shipping_template_id = listing.shipping_template_id || 'None';
              preview.updated.shipping_template_id = op.value;
              preview.changes.push(`Shipping Template: ${preview.current.shipping_template_id} → ${preview.updated.shipping_template_id}`);
            }
            break;
        }
      }

      results.push(preview);

      // Apply updates if not preview mode
      if (!previewMode && Object.keys(updateData).length > 0) {
        try {
          await etsyAPI.updateListing(listing.listing_id.toString(), updateData);
        } catch (error: any) {
          errors.push({ listing_id: listing.listing_id.toString(), error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      preview: previewMode,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: listingIds.length,
        processed: results.length,
        errors: errors.length,
      },
    });
  } catch (error: any) {
    console.error('[Bulk Operations API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process bulk operations' },
      { status: 500 }
    );
  }
}

