/**
 * Etsy Scheduler with Compliance Features
 * 
 * Automatically syncs Etsy data while respecting:
 * - Data freshness requirements (6 hours for listings, 24 hours for other content)
 * - Rate limits
 * - API Terms of Use
 */

import connectDB from './mongodb';
import { EtsyShop, EtsyListing, EtsyOrder } from '@/models';
import { EtsyAPI, refreshAccessToken } from './etsy';
import { needsEtsyDataRefresh, EtsyRateLimiter } from './etsy-compliance';

export class EtsyScheduler {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  /**
   * Start the scheduler
   * @param intervalMinutes - How often to check for sync needs (default: 5 minutes)
   */
  start(intervalMinutes = 5) {
    if (this.isRunning) {
      console.log('Etsy scheduler is already running');
      return;
    }

    console.log(`Starting Etsy scheduler (checking every ${intervalMinutes} minutes)`);
    this.isRunning = true;

    // Run immediately on start
    this.checkAndSync();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.checkAndSync();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('Etsy scheduler stopped');
  }

  /**
   * Check shops and sync data that needs refresh per API Terms
   */
  private async checkAndSync() {
    try {
      await connectDB();

      const shops = await EtsyShop.find({ isActive: true });
      console.log(`Checking ${shops.length} active Etsy shop(s) for sync needs`);

      for (const shop of shops) {
        try {
          // Check if token needs refresh
          if (shop.tokenExpiresAt && shop.tokenExpiresAt <= new Date()) {
            if (shop.refreshToken) {
              console.log(`Refreshing token for shop ${shop.shopName}`);
              const tokenResponse = await refreshAccessToken(shop.refreshToken);
              shop.accessToken = tokenResponse.access_token;
              if (tokenResponse.refresh_token) {
                shop.refreshToken = tokenResponse.refresh_token;
              }
              shop.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
              await shop.save();
            }
          }

          // Check listings that need refresh (6 hours per API Terms)
          const listings = await EtsyListing.find({ shopId: shop.shopId });
          const staleListings = listings.filter(listing => 
            needsEtsyDataRefresh(listing.lastSyncedAt, 'listing')
          );

          // Check other content that needs refresh (24 hours per API Terms)
          const orders = await EtsyOrder.find({ shopId: shop.shopId });
          const staleOrders = orders.filter(order => 
            needsEtsyDataRefresh(order.lastSyncedAt, 'other')
          );

          // Sync if any data is stale
          if (staleListings.length > 0 || staleOrders.length > 0) {
            console.log(`Syncing stale data for shop ${shop.shopName}: ${staleListings.length} listings, ${staleOrders.length} orders`);
            await this.syncShop(shop);
          } else {
            console.log(`All data fresh for shop ${shop.shopName}`);
          }

        } catch (error) {
          console.error(`Error syncing shop ${shop.shopName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in Etsy scheduler:', error);
    }
  }

  /**
   * Sync data for a specific shop
   */
  private async syncShop(shop: any) {
    const rateLimiter = EtsyRateLimiter.getInstance();
    const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId);

    try {
      // Sync listings if needed
      const listings = await EtsyListing.find({ shopId: shop.shopId });
      const needsListingsRefresh = listings.some(listing => 
        needsEtsyDataRefresh(listing.lastSyncedAt, 'listing')
      );

      if (needsListingsRefresh) {
        await rateLimiter.waitIfNeeded();
        const freshListings = await etsyAPI.getListings(shop.shopId);

        for (const listing of freshListings) {
          await rateLimiter.waitIfNeeded();
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

          await EtsyListing.findOneAndUpdate(
            { etsyListingId: listing.listing_id.toString() },
            listingData,
            { upsert: true }
          );
        }
      }

      // Sync orders if needed
      const orders = await EtsyOrder.find({ shopId: shop.shopId });
      const needsOrdersRefresh = orders.some(order => 
        needsEtsyDataRefresh(order.lastSyncedAt, 'other')
      );

      if (needsOrdersRefresh) {
        await rateLimiter.waitIfNeeded();
        const freshOrders = await etsyAPI.getOrders(shop.shopId);

        for (const order of freshOrders) {
          await rateLimiter.waitIfNeeded();
          const orderData = {
            etsyOrderId: order.receipt_id.toString(),
            shopId: shop.shopId,
            receiptId: order.receipt_id.toString(),
            buyerUserId: order.buyer.user_id.toString(),
            status: order.status,
            paymentStatus: order.payment_status,
            shippingStatus: order.shipping_status,
            total: order.grandtotal.amount / order.grandtotal.divisor,
            currency: order.grandtotal.currency_code,
            lastSyncedAt: new Date(),
          };

          await EtsyOrder.findOneAndUpdate(
            { etsyOrderId: order.receipt_id.toString() },
            orderData,
            { upsert: true }
          );
        }
      }

      // Update shop last sync time
      shop.lastSyncAt = new Date();
      await shop.save();

      console.log(`Successfully synced shop ${shop.shopName}`);
    } catch (error) {
      console.error(`Error syncing shop ${shop.shopName}:`, error);
      throw error;
    }
  }
}

// Singleton instance
let schedulerInstance: EtsyScheduler | null = null;

export function getEtsyScheduler(): EtsyScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new EtsyScheduler();
  }
  return schedulerInstance;
}
