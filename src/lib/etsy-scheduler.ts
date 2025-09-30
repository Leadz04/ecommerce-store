import { EtsyShop, EtsyListing, EtsyOrder } from '@/models';
import { EtsyAPI } from './etsy';
import connectDB from './mongodb';

export class EtsyScheduler {
  private static instance: EtsyScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): EtsyScheduler {
    if (!EtsyScheduler.instance) {
      EtsyScheduler.instance = new EtsyScheduler();
    }
    return EtsyScheduler.instance;
  }

  public start() {
    if (this.isRunning) {
      console.log('Etsy scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Etsy scheduler...');

    // Run immediately on start
    this.runSync();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.runSync();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Etsy scheduler stopped');
  }

  private async runSync() {
    try {
      await connectDB();

      const shops = await EtsyShop.find({ 
        isActive: true,
        syncSettings: { $exists: true }
      });

      for (const shop of shops) {
        const { syncSettings } = shop;
        
        // Check if it's time to sync based on shop settings
        const now = new Date();
        const lastSync = shop.lastSyncAt || new Date(0);
        const syncInterval = (syncSettings.syncInterval || 60) * 60 * 1000; // Convert minutes to milliseconds

        if (now.getTime() - lastSync.getTime() < syncInterval) {
          continue; // Skip this shop, not time to sync yet
        }

        console.log(`Running sync for shop: ${shop.shopName}`);

        const etsyAPI = new EtsyAPI(shop.accessToken, shop.shopId);

        // Sync based on shop settings
        if (syncSettings.autoSyncProducts) {
          await this.syncListings(etsyAPI, shop);
        }

        if (syncSettings.autoSyncOrders) {
          await this.syncOrders(etsyAPI, shop);
        }

        if (syncSettings.autoSyncInventory) {
          await this.syncInventory(etsyAPI, shop);
        }

        // Update last sync time
        shop.lastSyncAt = new Date();
        await shop.save();
      }

    } catch (error) {
      console.error('Etsy scheduler error:', error);
    }
  }

  private async syncListings(etsyAPI: EtsyAPI, shop: any) {
    try {
      const listings = await etsyAPI.getListings(shop.shopId);
      
      for (const listing of listings) {
        const existingListing = await EtsyListing.findOne({ 
          etsyListingId: listing.listing_id.toString() 
        });
        
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
        } else {
          await EtsyListing.create(listingData);
        }
      }

      console.log(`Synced ${listings.length} listings for shop ${shop.shopName}`);
    } catch (error) {
      console.error(`Failed to sync listings for shop ${shop.shopName}:`, error);
    }
  }

  private async syncOrders(etsyAPI: EtsyAPI, shop: any) {
    try {
      const orders = await etsyAPI.getOrders(shop.shopId);
      
      for (const order of orders) {
        const existingOrder = await EtsyOrder.findOne({ 
          etsyOrderId: order.receipt_id.toString() 
        });
        
        if (existingOrder) {
          // Update existing order
          const orderData = {
            status: order.status,
            paymentStatus: order.payment_status,
            shippingStatus: order.shipping_status,
            total: order.grandtotal.amount / order.grandtotal.divisor,
            currency: order.grandtotal.currency_code,
            shippingCost: order.total_shipping_cost.amount / order.total_shipping_cost.divisor,
            taxCost: order.total_tax_cost.amount / order.total_tax_cost.divisor,
            lastSyncedAt: new Date(),
          };

          await EtsyOrder.updateOne(
            { etsyOrderId: order.receipt_id.toString() },
            { $set: orderData }
          );
        } else {
          // Create new order
          const orderData = {
            etsyOrderId: order.receipt_id.toString(),
            shopId: shop.shopId,
            receiptId: order.receipt_id.toString(),
            buyerUserId: order.buyer.user_id.toString(),
            buyerEmail: order.buyer.login_name,
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

          await EtsyOrder.create(orderData);
        }
      }

      console.log(`Synced ${orders.length} orders for shop ${shop.shopName}`);
    } catch (error) {
      console.error(`Failed to sync orders for shop ${shop.shopName}:`, error);
    }
  }

  private async syncInventory(etsyAPI: EtsyAPI, shop: any) {
    try {
      const listings = await EtsyListing.find({ shopId: shop.shopId });
      
      for (const listing of listings) {
        try {
          const inventory = await etsyAPI.getListingInventory(listing.etsyListingId);
          const quantity = inventory.products[0]?.offerings[0]?.quantity || 0;
          
          await EtsyListing.updateOne(
            { etsyListingId: listing.etsyListingId },
            { 
              $set: { 
                'inventory.quantity': quantity,
                lastSyncedAt: new Date(),
              }
            }
          );
        } catch (error) {
          console.error(`Failed to sync inventory for listing ${listing.etsyListingId}:`, error);
        }
      }

      console.log(`Synced inventory for ${listings.length} listings in shop ${shop.shopName}`);
    } catch (error) {
      console.error(`Failed to sync inventory for shop ${shop.shopName}:`, error);
    }
  }
}

// Auto-start the scheduler if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const scheduler = EtsyScheduler.getInstance();
  scheduler.start();
}
