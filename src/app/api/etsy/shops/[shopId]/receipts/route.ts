import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop, EtsyOrder } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shops/[shopId]/receipts
 * Get shop receipts - matches Business Suite component expectations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const minCreated = searchParams.get('min_created') ? parseInt(searchParams.get('min_created')!, 10) : undefined;
    const maxCreated = searchParams.get('max_created') ? parseInt(searchParams.get('max_created')!, 10) : undefined;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

    // Create EtsyAPI instance with token refresh callback
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

    // Invalidate cache if force refresh requested
    if (forceRefresh) {
      await invalidateCache(userId, { shopId, cacheKeyPattern: 'shop-receipts' });
    }

    // Check cache first (unless forcing refresh)
    const cacheKey = generateCacheKey('shop-receipts', { shopId, limit, offset, minCreated, maxCreated });
    const cachedReceipts = await getCachedData<any[]>(cacheKey, userId);
    
    let receipts: any[] = [];
    if (cachedReceipts && !forceRefresh) {
      console.log(`[Cache HIT] Receipts for shopId: ${shopId}`);
      receipts = cachedReceipts;
    } else {
      // Get receipts from Etsy API
      console.log(`[Cache MISS] Fetching receipts from Etsy API for shopId: ${shopId}`);
      const options: any = { limit, offset };
      if (minCreated) options.min_created = minCreated;
      if (maxCreated) options.max_created = maxCreated;

      const response = await etsyAPI.getShopReceipts(shopId, options);
      receipts = response.results || [];
      
      // Save to cache
      await setCachedData(cacheKey, userId, receipts, CACHE_TTL.RECEIPTS, shopId);
      
      // Also save to EtsyOrder collection
      for (const receipt of receipts) {
        try {
          const etsyOrderId = receipt.receipt_id.toString();
          await EtsyOrder.findOneAndUpdate(
            { etsyOrderId, userId },
            {
              $set: {
                userId,
                etsyOrderId,
                shopId,
                receiptId: etsyOrderId,
                buyerUserId: receipt.buyer_user_id?.toString() || '',
                buyerEmail: receipt.payment_email || '',
                status: receipt.is_cancelled ? 'cancelled' : receipt.is_delivered ? 'completed' : 'open',
                paymentStatus: receipt.is_paid ? 'paid' : 'pending',
                shippingStatus: receipt.is_delivered ? 'delivered' : receipt.is_shipped ? 'shipped' : 'pending',
                total: receipt.grandtotal ? receipt.grandtotal.amount / receipt.grandtotal.divisor : 0,
                currency: receipt.grandtotal?.currency_code || 'USD',
                shippingCost: receipt.total_shipping_cost ? receipt.total_shipping_cost.amount / receipt.total_shipping_cost.divisor : 0,
                taxCost: receipt.total_tax_cost ? receipt.total_tax_cost.amount / receipt.total_tax_cost.divisor : 0,
                lastSyncedAt: new Date(),
              }
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.warn(`Failed to save receipt ${receipt.receipt_id} to DB:`, err);
        }
      }
    }

    // Transform receipts to match component expectations
    const transformedReceipts = receipts.map((receipt: any) => ({
      receiptId: receipt.receipt_id,
      receiptType: receipt.receipt_type,
      orderId: receipt.order_id?.toString() || '',
      sellerUserId: receipt.seller_user_id,
      buyerUserId: receipt.buyer_user_id,
      creationTimestamp: receipt.creation_timestamp,
      lastModifiedTimestamp: receipt.last_modified_timestamp,
      name: receipt.name,
      firstLine: receipt.first_line,
      secondLine: receipt.second_line,
      city: receipt.city,
      state: receipt.state,
      zip: receipt.zip,
      countryIso: receipt.country_iso,
      paymentEmail: receipt.payment_email,
      paymentMethod: receipt.payment_method,
      paymentEmailSentTimestamp: receipt.payment_email_sent_timestamp,
      paymentEmailSentDate: receipt.payment_email_sent_date,
      messageFromSeller: receipt.message_from_seller,
      messageFromBuyer: receipt.message_from_buyer,
      messageFromPayment: receipt.message_from_payment,
      isPaid: receipt.is_paid,
      isShipped: receipt.is_shipped,
      isDelivered: receipt.is_delivered,
      isCancelled: receipt.is_cancelled,
      grandTotal: receipt.grandtotal ? {
        amount: receipt.grandtotal.amount / (receipt.grandtotal.divisor || 1),
        currencyCode: receipt.grandtotal.currency_code,
      } : undefined,
      subtotal: receipt.subtotal ? {
        amount: receipt.subtotal.amount / (receipt.subtotal.divisor || 1),
        currencyCode: receipt.subtotal.currency_code,
      } : undefined,
      totalTaxCost: receipt.total_tax_cost ? {
        amount: receipt.total_tax_cost.amount / (receipt.total_tax_cost.divisor || 1),
        currencyCode: receipt.total_tax_cost.currency_code,
      } : undefined,
      totalShippingCost: receipt.total_shipping_cost ? {
        amount: receipt.total_shipping_cost.amount / (receipt.total_shipping_cost.divisor || 1),
        currencyCode: receipt.total_shipping_cost.currency_code,
      } : undefined,
      totalVatCost: receipt.total_vat_cost ? {
        amount: receipt.total_vat_cost.amount / (receipt.total_vat_cost.divisor || 1),
        currencyCode: receipt.total_vat_cost.currency_code,
      } : undefined,
      discountAmt: receipt.discount_amt ? {
        amount: receipt.discount_amt.amount / (receipt.discount_amt.divisor || 1),
        currencyCode: receipt.discount_amt.currency_code,
      } : undefined,
      currencyCode: receipt.currency_code,
      messageFromSellerTimestamp: receipt.message_from_seller_timestamp,
      messageFromBuyerTimestamp: receipt.message_from_buyer_timestamp,
      wasPaid: receipt.was_paid,
      wasShipped: receipt.was_shipped,
      wasDelivered: receipt.was_delivered,
      wasCancelled: receipt.was_cancelled,
      needsGiftWrap: receipt.needs_gift_wrap,
      giftMessage: receipt.gift_message,
      giftWrapPrice: receipt.gift_wrap_price ? {
        amount: receipt.gift_wrap_price.amount / (receipt.gift_wrap_price.divisor || 1),
        currencyCode: receipt.gift_wrap_price.currency_code,
      } : undefined,
      formattedAddress: receipt.formatted_address,
      totalShippingCostDiscount: receipt.total_shipping_cost_discount ? {
        amount: receipt.total_shipping_cost_discount.amount / (receipt.total_shipping_cost_discount.divisor || 1),
        currencyCode: receipt.total_shipping_cost_discount.currency_code,
      } : undefined,
      minimumProcessingDays: receipt.minimum_processing_days,
      maximumProcessingDays: receipt.maximum_processing_days,
      estimatedDeliveryDate: receipt.estimated_delivery_date,
      shipByDate: receipt.ship_by_date,
      shippedTimestamp: receipt.shipped_timestamp,
      deliveredTimestamp: receipt.delivered_timestamp,
      carrierName: receipt.carrier_name,
      trackingCode: receipt.tracking_code,
      trackingUrl: receipt.tracking_url,
      buyerCoupon: receipt.buyer_coupon,
      shopCouponId: receipt.shop_coupon_id,
      buyerCouponDiscount: receipt.buyer_coupon_discount ? {
        amount: receipt.buyer_coupon_discount.amount / (receipt.buyer_coupon_discount.divisor || 1),
        currencyCode: receipt.buyer_coupon_discount.currency_code,
      } : undefined,
      salesTax: receipt.sales_tax ? {
        amount: receipt.sales_tax.amount / (receipt.sales_tax.divisor || 1),
        currencyCode: receipt.sales_tax.currency_code,
      } : undefined,
      salesTaxCollectionMethod: receipt.sales_tax_collection_method,
      hasVariations: receipt.has_variations,
      needsGiftWrap2: receipt.needs_gift_wrap_2,
      isInPerson: receipt.is_in_person,
      isGift: receipt.is_gift,
      isGiftMessage: receipt.is_gift_message,
      isGiftWrap: receipt.is_gift_wrap,
      transactions: receipt.transactions?.map((tx: any) => ({
        transactionId: tx.transaction_id,
        title: tx.title,
        description: tx.description,
        sellerUserId: tx.seller_user_id,
        buyerUserId: tx.buyer_user_id,
        createdTimestamp: tx.created_timestamp,
        paidTimestamp: tx.paid_timestamp,
        shippedTimestamp: tx.shipped_timestamp,
        price: {
          amount: tx.price?.amount / (tx.price?.divisor || 1) || 0,
          currencyCode: tx.price?.currency_code || 'USD',
        },
        currencyCode: tx.currency_code,
        quantity: tx.quantity,
        tags: tx.tags || [],
        materials: tx.materials || [],
        imageListingId: tx.image_listing_id,
        productId: tx.product_id,
        sku: tx.sku,
        variations: tx.variations || [],
        productData: tx.product_data,
        listingId: tx.listing_id,
        listingType: tx.listing_type,
        purchaseDate: tx.purchase_date,
        shippingCost: tx.shipping_cost ? {
          amount: tx.shipping_cost.amount / (tx.shipping_cost.divisor || 1),
          currencyCode: tx.shipping_cost.currency_code,
        } : undefined,
        isDigital: tx.is_digital,
        fileData: tx.file_data,
        listingImageId: tx.listing_image_id,
        transactionType: tx.transaction_type,
        downpaymentId: tx.downpayment_id,
        downpaymentType: tx.downpayment_type,
        buyerEmail: tx.buyer_email,
        isQuickSale: tx.is_quick_sale,
        isGift: tx.is_gift,
        isGiftMessage: tx.is_gift_message,
        isGiftWrap: tx.is_gift_wrap,
      })) || [],
    }));

    return NextResponse.json({
      success: true,
      results: transformedReceipts,
      count: transformedReceipts.length,
    });
  } catch (error: any) {
    console.error('[Etsy Shop Receipts API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch receipts' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
