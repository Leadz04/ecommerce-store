import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EtsyShop } from '@/models';
import { EtsyAPI } from '@/lib/etsy';
import { getCurrentUserId, getUserShop } from '@/lib/etsy-auth-helper';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/etsy-cache';

/**
 * GET /api/etsy/shop/[shopId]
 * Get shop details for a specific shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { shopId } = await params;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    await connectDB();

    const shop = await getUserShop(userId, shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found, inactive, or access denied' }, { status: 404 });
    }

    // Check cache first
    const cacheKey = generateCacheKey('shop-info', { shopId });
    const cachedShopInfo = await getCachedData<any>(cacheKey, userId);
    
    let shopInfo: any;
    if (cachedShopInfo) {
      console.log(`[Cache HIT] Shop info for shopId: ${shopId}`);
      shopInfo = cachedShopInfo;
    } else {
      console.log(`[Cache MISS] Fetching shop info from Etsy API for shopId: ${shopId}`);
      
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

      // Get shop info from Etsy API
      shopInfo = await etsyAPI.getShopInfo(shopId);
      
      // Save to cache
      await setCachedData(cacheKey, userId, shopInfo, CACHE_TTL.SHOP, shopId);
      console.log(`[Cache SET] Shop info cached for shopId: ${shopId}`);
    }

    // Transform to match component expectations
    const shopData = {
      shopId: shopInfo.shop_id,
      shopName: shopInfo.shop_name,
      title: shopInfo.title,
      currencyCode: shopInfo.currency_code,
      isVacation: shopInfo.is_vacation,
      vacationMessage: shopInfo.vacation_message,
      saleMessage: shopInfo.sale_message,
      digitalSaleMessage: shopInfo.digital_sale_message,
      lastUpdatedOn: shopInfo.last_updated_tsz,
      listingActiveCount: shopInfo.listing_active_count,
      loginName: shopInfo.login_name,
      acceptsCustomRequests: shopInfo.accepts_custom_requests,
      policyWelcome: shopInfo.policy_welcome,
      policyPayment: shopInfo.policy_payment,
      policyShipping: shopInfo.policy_shipping,
      policyRefunds: shopInfo.policy_refunds,
      policyAdditional: shopInfo.policy_additional,
      policySellerInfo: shopInfo.policy_seller_info,
      policyUpdateDate: shopInfo.policy_updated_tsz,
      hasUnstructuredPolicies: shopInfo.has_unstructured_policies,
      policyPrivacy: shopInfo.policy_privacy,
      url: shopInfo.url,
      imageUrl760x100: shopInfo.image_url_760x100,
      numFavorers: shopInfo.num_favorers,
      languages: shopInfo.languages,
      iconUrlFullxFull: shopInfo.icon_url_fullxfull,
      isUsingStructuredPolicies: shopInfo.is_using_structured_policies,
      hasOnboardedStructuredPolicies: shopInfo.has_onboarded_structured_policies,
      includeDisputeFormLink: shopInfo.include_dispute_form_link,
      isDirectCheckoutOnboarded: shopInfo.is_direct_checkout_onboarded,
      isCalculatedEligible: shopInfo.is_calculated_eligible,
      isOptedInToBuyerPromise: shopInfo.is_opted_in_to_buyer_promise,
      isShopUsBased: shopInfo.is_shop_us_based,
      isEtsyPaymentsOnboarded: shopInfo.is_etsy_payments_onboarded,
      isCBTOnboarded: shopInfo.is_cbt_onboarded,
      isCBTEnabled: shopInfo.is_cbt_enabled,
      isCBTAllowed: shopInfo.is_cbt_allowed,
      transactionSoldCount: shopInfo.transaction_sold_count,
      shippingFromCountryIso: shopInfo.shipping_from_country_iso,
      shopLocationCountryIso: shopInfo.shop_location_country_iso,
      reviewCount: shopInfo.review_count,
      reviewAverage: shopInfo.review_average,
    };

    return NextResponse.json({
      success: true,
      shop: shopData,
    });
  } catch (error: any) {
    console.error('[Etsy Shop API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to fetch shop details' 
      },
      { status: error?.message?.includes('authentication') ? 401 : 500 }
    );
  }
}
