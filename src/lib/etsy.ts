import { EtsyShop, EtsyListing, EtsyOrder } from '@/models';

const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

export interface EtsyAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface EtsyShopInfo {
  shop_id: number;
  shop_name: string;
  user_id: number;
  creation_tsz: number;
  title: string;
  announcement?: string;
  currency_code: string;
  is_vacation: boolean;
  vacation_message?: string;
  sale_message?: string;
  digital_sale_message?: string;
  last_updated_tsz: number;
  listing_active_count: number;
  digital_listing_count: number;
  login_name: string;
  accepts_custom_requests: boolean;
  policy_welcome?: string;
  policy_payment?: string;
  policy_shipping?: string;
  policy_refunds?: string;
  policy_additional?: string;
  policy_seller_info?: string;
  policy_updated_tsz: number;
  vacation_autoreply?: string;
  url: string;
  image_url_760x100?: string;
  num_favorers: number;
  languages: string[];
  icon_url_fullxfull?: string;
  is_using_structured_policies: boolean;
  has_onboarded_structured_policies: boolean;
  include_dispute_form_link: boolean;
  is_direct_checkout_onboarded: boolean;
  is_calculated_eligible: boolean;
  is_opted_in_to_buyer_promise: boolean;
  is_shop_us_based: boolean;
  transaction_sold_count: number;
  shipping_from_country_iso?: string;
  shop_location_country_iso?: string;
  review_count: number;
  review_average?: number;
}

export interface EtsyListingData {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: 'active' | 'inactive' | 'draft' | 'expired' | 'sold_out';
  creation_timestamp: number;
  created_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  state_timestamp: number;
  quantity: number;
  tags: string[];
  materials: string[];
  category_path: string[];
  category_path_ids: number[];
  taxonomy_id: number;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  url: string;
  views: number;
  num_favorers: number;
  shipping_template_id?: number;
  processing_min: number;
  processing_max: number;
  who_made: 'i_did' | 'collective' | 'someone_else';
  when_made: 'made_to_order' | '2020_2023' | '2010_2019' | '2004_2009' | 'before_2004' | '2000_2003' | '1990s' | '1980s' | '1970s' | '1960s' | '1950s' | '1940s' | '1930s' | '1920s' | '1910s' | '1900s' | '1800s' | '1700s' | '1600s' | '1500s' | '1400s' | '1300s' | '1200s' | '1100s' | '1000s' | '900s' | '800s' | '700s' | '600s' | '500s' | '400s' | '300s' | '200s' | '100s' | '0s';
  is_supply: boolean;
  is_customizable: boolean;
  is_digital: boolean;
  file_data?: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  is_private: boolean;
  style?: string;
  taxonomy_path: string[];
  used_manufacturer: boolean;
  is_vintage: boolean;
}

export interface EtsyOrderData {
  receipt_id: number;
  receipt_type: number;
  order_id: number;
  seller_user_id: number;
  buyer_user_id: number;
  creation_timestamp: number;
  last_modified_timestamp: number;
  initial_creation_timestamp: number;
  is_gift: boolean;
  gift_message?: string;
  grandtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  subtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_vat_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  discount_amt: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  gift_wrap_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipments: any[];
  transactions: any[];
  seller: {
    user_id: number;
    login_name: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    is_seller: boolean;
  };
  buyer: {
    user_id: number;
    login_name: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    is_seller: boolean;
  };
  status: 'open' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  shipping_status: 'pending' | 'shipped' | 'delivered';
  message_from_buyer?: string;
  message_from_seller?: string;
  was_paid: boolean;
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
}

export class EtsyAPI {
  private accessToken: string;
  private shopId?: string;

  constructor(accessToken: string, shopId?: string) {
    this.accessToken = accessToken;
    this.shopId = shopId;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${ETSY_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Etsy API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Shop methods
  async getShopInfo(shopId: string): Promise<EtsyShopInfo> {
    return this.makeRequest(`/application/shops/${shopId}`);
  }

  async getShopsForUser(): Promise<EtsyShopInfo[]> {
    const response = await this.makeRequest('/application/users/me/shops');
    return response.results;
  }

  // Listing methods
  async getListings(shopId: string, limit = 100, offset = 0): Promise<EtsyListingData[]> {
    const response = await this.makeRequest(
      `/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`
    );
    return response.results;
  }

  async getListing(listingId: string): Promise<EtsyListingData> {
    return this.makeRequest(`/application/listings/${listingId}`);
  }

  async createListing(shopId: string, listingData: Partial<EtsyListingData>): Promise<EtsyListingData> {
    return this.makeRequest(`/application/shops/${shopId}/listings`, {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  async updateListing(listingId: string, listingData: Partial<EtsyListingData>): Promise<EtsyListingData> {
    return this.makeRequest(`/application/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    });
  }

  async deleteListing(listingId: string): Promise<void> {
    await this.makeRequest(`/application/listings/${listingId}`, {
      method: 'DELETE',
    });
  }

  // Order methods
  async getOrders(shopId: string, limit = 100, offset = 0): Promise<EtsyOrderData[]> {
    const response = await this.makeRequest(
      `/application/shops/${shopId}/receipts?limit=${limit}&offset=${offset}`
    );
    return response.results;
  }

  async getOrder(receiptId: string): Promise<EtsyOrderData> {
    return this.makeRequest(`/application/receipts/${receiptId}`);
  }

  async updateOrderStatus(receiptId: string, status: string): Promise<EtsyOrderData> {
    return this.makeRequest(`/application/receipts/${receiptId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Image methods
  async getListingImages(listingId: string): Promise<any[]> {
    const response = await this.makeRequest(`/application/listings/${listingId}/images`);
    return response.results;
  }

  async uploadListingImage(listingId: string, imageData: FormData): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/images`, {
      method: 'POST',
      body: imageData,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        // Don't set Content-Type for FormData
      },
    });
  }

  // Inventory methods
  async getListingInventory(listingId: string): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/inventory`);
  }

  async updateListingInventory(listingId: string, inventoryData: any): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData),
    });
  }
}

// OAuth helper functions
export async function getEtsyAuthUrl(): Promise<string> {
  const clientId = process.env.ETSY_CLIENT_ID;
  const redirectUri = process.env.ETSY_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('ETSY_CLIENT_ID and ETSY_REDIRECT_URI must be set in environment variables');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: 'listings_r listings_w shops_r shops_w transactions_r transactions_w',
    state: 'random_state_string', // In production, use a proper state parameter
  });

  return `https://www.etsy.com/oauth/connect?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<EtsyAuthResponse> {
  const clientId = process.env.ETSY_CLIENT_ID;
  const clientSecret = process.env.ETSY_CLIENT_SECRET;
  const redirectUri = process.env.ETSY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('ETSY_CLIENT_ID, ETSY_CLIENT_SECRET, and ETSY_REDIRECT_URI must be set');
  }

  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<EtsyAuthResponse> {
  const clientId = process.env.ETSY_CLIENT_ID;
  const clientSecret = process.env.ETSY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('ETSY_CLIENT_ID and ETSY_CLIENT_SECRET must be set');
  }

  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${error}`);
  }

  return response.json();
}
