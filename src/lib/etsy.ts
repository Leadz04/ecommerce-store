import { EtsyShop, EtsyListing, EtsyOrder } from '@/models';
import { EtsyRateLimiter, needsEtsyDataRefresh } from './etsy-compliance';
import crypto from 'crypto';

const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

/**
 * Normalizes a string to prevent Etsy's "all_caps" validation error
 * and other common title/string issues.
 * Etsy rule: "more than 3 start with 2 sequential capital letters"
 */
export function normalizeEtsyString(str: string): string {
  if (!str) return '';

  // Etsy Title limit is 140 characters
  let normalized = str.trim().substring(0, 140);

  const words = normalized.split(/\s+/);
  const sequentialCapsWords = words.filter(word => /^[A-Z]{2}/.test(word));

  // If the string has words with sequential capitals (like ALL CAPS)
  // we convert it to title case to avoid Etsy's validation errors.
  if (sequentialCapsWords.length > 3 || (normalized === normalized.toUpperCase() && normalized.length > 10)) {
    normalized = normalized
      .toLowerCase()
      .split(/(\s+|[-/])/) // Split by whitespace, hyphens, or slashes
      .map(part => {
        if (/^[\s\-/]+$/.test(part)) return part;
        if (part.length === 0) return part;
        // Capitalize first letter of each word
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
  }

  return normalized;
}

/**
 * Normalizes a single Etsy tag.
 * Etsy rules:
 * - Max 20 characters
 * - Only letters, numbers, and spaces
 */
export function normalizeEtsyTag(tag: string): string {
  if (!tag) return '';

  // Replace anything not a letter, number, or space with a space
  // then collapse multiple spaces into one
  let normalized = tag
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Crop to 20 characters
  return normalized.substring(0, 20).trim();
}

/**
 * Normalizes an array of tags.
 * Etsy rule: Max 13 tags.
 */
export function normalizeEtsyTags(tags: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];

  return tags
    .map(t => normalizeEtsyTag(t))
    .filter(t => t.length > 0)
    .slice(0, 13);
}

/**
 * Normalizes a single Etsy material string.
 * Etsy rules: 
 * - Max 20 characters
 * - Letters, numbers, and spaces only
 */
export function normalizeEtsyMaterial(material: string): string {
  if (!material) return '';
  return material
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 20)
    .trim();
}

/**
 * Normalizes an array of materials.
 * Etsy rule: Max 13 materials.
 */
export function normalizeEtsyMaterials(materials: string[]): string[] {
  if (!materials || !Array.isArray(materials)) return [];
  return materials
    .map(m => normalizeEtsyMaterial(m))
    .filter(m => m.length > 0)
    .slice(0, 13);
}

/**
 * Normalizes Etsy description.
 * Etsy rule: Max 15,000 characters.
 */
export function normalizeEtsyDescription(desc: string): string {
  if (!desc) return '';
  return desc.substring(0, 15000);
}

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
  is_star_seller?: boolean;
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
  price: number | {
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
  shipping_profile_id?: number;
  readiness_state_id?: number;
  type?: 'physical' | 'download' | 'both';
}

export interface EtsyOrderData {
  receipt_id: number;
  receipt_type: number;
  order_id: number;
  seller_user_id: number;
  buyer_user_id: number;
  buyer_email?: string; // Etsy sometimes omits this field
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
  // Top-level shipping address fields (Etsy API includes these at top level)
  name?: string;
  first_line?: string;
  second_line?: string;
  city?: string;
  state?: string;
  zip?: string;
  country_iso?: string;
  buyer_phone?: string;
  shipping_address?: {
    first_line?: string;
    second_line?: string;
    city?: string;
    state?: string;
    zip?: string;
    country_iso?: string;
    phone?: string;
  };
}

// Public, API-key-only client for Etsy marketplace research endpoints
export class EtsyPublicAPI {
  private static getApiKey(): string {
    const apiKey =
      process.env.ETSY_X_API_KEY ||
      process.env.ETSY_CLIENT_ID ||
      '';

    if (!apiKey) {
      throw new Error('Missing Etsy API key. Set ETSY_X_API_KEY or ETSY_CLIENT_ID in environment variables.');
    }

    return apiKey;
  }

  private static async request(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const rateLimiter = EtsyRateLimiter.getInstance();
    await rateLimiter.waitIfNeeded();

    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Etsy API rate limit exceeded. Please wait before making another request.');
    }

    const url = new URL(`${ETSY_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });

    const apiKeyHeader = this.getApiKey();

    const requestMeta = {
      endpoint,
      url: url.toString(),
      method: 'GET',
      headers: {
        'x-api-key': '[redacted]',
      },
      params,
    };
    console.log('[EtsyPublicAPI] Request', requestMeta);

    const startTime = Date.now();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyHeader,
      },
    });

    const durationMs = Date.now() - startTime;
    rateLimiter.recordCall();

    // Check Content-Type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let errorText: string;
      if (isJson) {
        try {
          const errorJson = await response.json();
          errorText = typeof errorJson === 'object' ? JSON.stringify(errorJson) : String(errorJson);
        } catch {
          errorText = await response.text();
        }
      } else {
        errorText = await response.text();
      }
      console.error('[EtsyPublicAPI] Error Response', {
        endpoint,
        url: url.toString(),
        status: response.status,
        statusText: response.statusText,
        durationMs,
        contentType,
        errorBodyPreview: errorText.length > 1000 ? `${errorText.slice(0, 1000)}...<truncated>` : errorText,
      });
      throw new Error(`Etsy Public API Error: ${response.status} - ${errorText.substring(0, 500)}`);
    }

    if (!isJson) {
      const text = await response.text();
      console.error('[EtsyPublicAPI] Non-JSON Response', {
        endpoint,
        url: url.toString(),
        contentType,
        bodyPreview: text.substring(0, 500),
      });
      throw new Error(`Etsy Public API returned non-JSON response (${contentType}). Check API key and endpoint.`);
    }

    const json = await response.json();
    console.log('[EtsyPublicAPI] Response', {
      endpoint,
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      durationMs,
      bodyPreview: JSON.stringify(json).length > 5000
        ? `${JSON.stringify(json).slice(0, 5000)}...<truncated>`
        : json,
    });

    return json;
  }

  // Search active listings across the entire Etsy marketplace
  static async searchActiveListings(options: {
    keywords?: string;
    min_price?: number;
    max_price?: number;
    taxonomy_id?: number;
    shop_location?: string;
    limit?: number;
    offset?: number;
    sort_on?: 'created' | 'price' | 'updated' | 'score';
    sort_order?: 'asc' | 'ascending' | 'desc' | 'descending' | 'up' | 'down';
  }): Promise<any> {
    return this.request('/application/listings/active', options);
  }

  // Buyer taxonomy tree (what buyers see)
  static async getBuyerTaxonomyNodes(): Promise<any> {
    return this.request('/application/buyer-taxonomy/nodes');
  }

  // Seller taxonomy tree (what sellers choose)
  static async getSellerTaxonomyNodes(): Promise<any> {
    return this.request('/application/seller-taxonomy/nodes');
  }

  // Get a single listing with full details (public API)
  static async getListing(listingId: number | string, options: any = {}): Promise<any> {
    return this.request(`/application/listings/${listingId}`, options);
  }

  // Get images for a listing (public API)
  static async getListingImages(listingId: number | string): Promise<any> {
    return this.request(`/application/listings/${listingId}/images`);
  }

  // Get videos for a listing (public API)
  static async getListingVideos(listingId: number | string): Promise<any> {
    return this.request(`/application/listings/${listingId}/videos`);
  }
}

export class EtsyAPI {

  private accessToken: string;
  private refreshToken?: string;
  private shopId?: string;
  private onTokenRefresh?: (tokens: EtsyAuthResponse) => Promise<void>;

  constructor(accessToken: string, shopId?: string, refreshToken?: string, onTokenRefresh?: (tokens: EtsyAuthResponse) => Promise<void>) {
    this.accessToken = accessToken;
    this.shopId = shopId;
    this.refreshToken = refreshToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}, retryCount = 0, maxRetries = 3): Promise<any> {
    // Respect rate limits per Etsy API Terms
    const rateLimiter = EtsyRateLimiter.getInstance();
    await rateLimiter.waitIfNeeded();

    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Etsy API rate limit exceeded. Please wait before making another request.');
    }

    const url = `${ETSY_API_BASE}${endpoint}`;
    const apiKeyHeader =
      process.env.ETSY_X_API_KEY // recommended: "<api_key_keystring>:<shared_secret>"
      || process.env.ETSY_CLIENT_ID // fallback to client id if you've put the combined value here
      || '';

    const defaultHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'x-api-key': apiKeyHeader, // Required for V3 endpoints per Etsy docs
      'Content-Type': 'application/json',
    };

    const requestHeaders = options.headers as Record<string, string> | undefined;
    const finalHeaders = { ...defaultHeaders, ...requestHeaders };

    // If Content-Type is explicitly set to empty string or null in options, remove it
    // This allows fetch to set the correct boundary for FormData
    if (requestHeaders && 'Content-Type' in requestHeaders && !requestHeaders['Content-Type']) {
      delete finalHeaders['Content-Type'];
    }

    // Prepare a safe-to-log body preview
    let bodyPreview: string | undefined;
    if (typeof options.body === 'string') {
      // Avoid logging huge payloads
      bodyPreview = options.body.length > 1000 ? `${options.body.slice(0, 1000)}...<truncated>` : options.body;
    }

    const requestMeta = {
      endpoint,
      url,
      method: options.method || 'GET',
      headers: {
        ...finalHeaders,
        Authorization: '[redacted]',
        'x-api-key': '[redacted]',
      },
      hasBody: !!options.body,
      bodyPreview,
      retryCount,
    };

    // Helpful debug log without leaking secrets
    console.log('[EtsyAPI] Request', requestMeta);

    const startTime = Date.now();
    const timeoutMs = 30000; // 30 seconds timeout (increased from default 10s)

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          ...options,
          headers: finalHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Handle timeout and connection errors with retry logic
        const isTimeoutError = fetchError.name === 'AbortError' ||
          fetchError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          fetchError.code === 'ETIMEDOUT' ||
          fetchError.message?.includes('timeout') ||
          fetchError.message?.includes('Timeout');

        const isConnectionError = fetchError.code === 'ECONNREFUSED' ||
          fetchError.code === 'ENOTFOUND' ||
          fetchError.code === 'ECONNRESET' ||
          fetchError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          fetchError.message?.includes('fetch failed');

        if ((isTimeoutError || isConnectionError) && retryCount < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff: 1s, 2s, 4s, max 5s
          console.warn(`[EtsyAPI] ${isTimeoutError ? 'Timeout' : 'Connection'} error (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`, {
            endpoint,
            error: fetchError.message || fetchError.code,
          });

          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.makeRequest(endpoint, options, retryCount + 1, maxRetries);
        }

        // If we've exhausted retries or it's not a retryable error, throw
        const errorMessage = isTimeoutError
          ? `Etsy API request timed out after ${timeoutMs}ms. Please check your internet connection and try again.`
          : isConnectionError
            ? `Etsy API connection failed. Please check your internet connection and try again.`
            : `Etsy API request failed: ${fetchError.message || fetchError.code || 'Unknown error'}`;

        throw new Error(errorMessage);
      }

      const durationMs = Date.now() - startTime;

      // Record the API call for rate limiting
      rateLimiter.recordCall();

      // Handle token expiration (401)
      if (response.status === 401 && retryCount === 0 && this.refreshToken) {
        console.log('Etsy access token expired. Attempting refresh...');
        try {
          await this.refreshTokens();
          // Retry the request with new token
          return this.makeRequest(endpoint, options, retryCount + 1, maxRetries);
        } catch (refreshError) {
          console.error('Failed to refresh Etsy token:', refreshError);
          // If refresh fails, throw original 401 or refresh error
          throw new Error('Etsy API Authentication Failed: Token expired and refresh failed.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EtsyAPI] Error Response', {
          endpoint,
          url,
          status: response.status,
          statusText: response.statusText,
          durationMs,
          retryCount,
          errorBodyPreview: errorText.length > 1000 ? `${errorText.slice(0, 1000)}...<truncated>` : errorText,
        });
        throw new Error(`Etsy API Error: ${response.status} - ${errorText}`);
      }

      const json = await response.json();
      console.log('[EtsyAPI] Response', {
        endpoint,
        url,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        retryCount,
        // Avoid logging huge payloads
        bodyPreview: JSON.stringify(json).length > 5000
          ? `${JSON.stringify(json).slice(0, 5000)}...<truncated>`
          : json,
      });
      return json;
    } catch (error: any) {
      // Re-throw if it's already been handled (timeout/connection errors)
      if (error.message?.includes('timed out') || error.message?.includes('connection failed') || error.message?.includes('connection')) {
        throw error;
      }
      // For other unexpected errors, wrap and throw
      throw new Error(`Etsy API request failed: ${error.message || 'Unknown error'}`);
    }
  }



  private async refreshTokens() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const newTokens = await refreshAccessToken(this.refreshToken);

    // Update local state
    this.accessToken = newTokens.access_token;
    if (newTokens.refresh_token) {
      this.refreshToken = newTokens.refresh_token;
    }

    // Persist changes via callback
    if (this.onTokenRefresh) {
      await this.onTokenRefresh(newTokens);
    }
  }

  // Shop methods
  async getShopInfo(shopId: string): Promise<EtsyShopInfo> {
    return this.makeRequest(`/application/shops/${shopId}`);
  }

  async getShopsForUser(): Promise<EtsyShopInfo[]> {
    // Etsy access tokens are prefixed with the numeric user_id followed by a dot
    // e.g. "12345678.xxxxxx" – extract that integer for the /users/{user_id}/shops endpoint
    const userIdPart = this.accessToken.split('.')[0];
    const userId = parseInt(userIdPart, 10);

    if (Number.isNaN(userId)) {
      throw new Error('Invalid Etsy access token format: could not extract numeric user_id');
    }

    const response = await this.makeRequest(`/application/users/${userId}/shops`);

    // Some Etsy endpoints return an array directly, others wrap in { results },
    // and some return a single shop object. Normalize all of these to an array.
    if (Array.isArray(response)) {
      return response as EtsyShopInfo[];
    }
    if (response && Array.isArray((response as any).results)) {
      return (response as any).results as EtsyShopInfo[];
    }
    if (response && typeof response === 'object' && 'shop_id' in (response as any)) {
      return [response as EtsyShopInfo];
    }

    return [];
  }

  async getOrCreateReadinessState(shopId: string, readinessState: 1 | 2 = 2): Promise<number> {
    try {
      const states = await this.getReadinessStateDefinitions(shopId);
      const state = states?.find((s: any) => s.readiness_state === readinessState);

      if (state) {
        return state.readiness_state_id;
      }

      if (states && states.length > 0) {
        return states[0].readiness_state_id;
      }

      // Create a default one if none exist
      // 2 = made_to_order, 1-3 days
      const newState = await this.createReadinessStateDefinition(shopId, readinessState, 1, 3);
      return newState.readiness_state_id;
    } catch (error: any) {
      if (error?.message?.includes('Conflict') || error?.message?.includes('409')) {
        const states = await this.getReadinessStateDefinitions(shopId);
        const state = states?.find((s: any) => s.readiness_state === readinessState);
        if (state) return state.readiness_state_id;
        if (states && states.length > 0) return states[0].readiness_state_id;
      }
      console.warn('[EtsyAPI] Failed to get/create readiness state:', error);
      throw error;
    }
  }

  // Listing methods
  async getListings(shopId: string, limit = 100, offset = 0): Promise<EtsyListingData[]> {
    const response = await this.makeRequest(
      `/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`
    );

    return (response as any).results as EtsyListingData[];
  }

  async getListing(listingId: string): Promise<EtsyListingData> {
    return this.makeRequest(`/application/listings/${listingId}`);
  }

  async getShippingProfiles(shopId: string): Promise<any[]> {
    const response = await this.makeRequest(
      `/application/shops/${shopId}/shipping-profiles`
    );
    return response.results || [];
  }

  async getReadinessStateDefinitions(shopId: string): Promise<any[]> {
    const response = await this.makeRequest(
      `/application/shops/${shopId}/readiness-state-definitions`
    );
    return response.results || [];
  }

  async createReadinessStateDefinition(shopId: string, readinessState: 1 | 2, processingMin: number, processingMax: number): Promise<any> {
    const formData = new URLSearchParams();
    formData.append('readiness_state', readinessState.toString());
    formData.append('processing_min', processingMin.toString());
    formData.append('processing_max', processingMax.toString());

    return this.makeRequest(`/application/shops/${shopId}/readiness-state-definitions`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async createListing(shopId: string, listingData: Partial<EtsyListingData>): Promise<EtsyListingData> {
    // Etsy API requires application/x-www-form-urlencoded format
    // Convert the listing data to form-urlencoded format
    const formData = new URLSearchParams();

    // Required fields
    if (listingData.title) formData.append('title', normalizeEtsyString(listingData.title));
    if (listingData.description) formData.append('description', normalizeEtsyDescription(listingData.description));
    if (listingData.quantity !== undefined) formData.append('quantity', listingData.quantity.toString());

    // Price: convert from object format to float
    if (listingData.price) {
      const priceValue = typeof listingData.price === 'object'
        ? (listingData.price.amount / listingData.price.divisor).toFixed(2)
        : listingData.price.toString();
      formData.append('price', priceValue);
    }

    if (listingData.taxonomy_id) formData.append('taxonomy_id', listingData.taxonomy_id.toString());
    if (listingData.who_made) formData.append('who_made', listingData.who_made);
    if (listingData.when_made) formData.append('when_made', listingData.when_made);

    // Optional fields
    if (listingData.tags && Array.isArray(listingData.tags)) {
      const cleanTags = normalizeEtsyTags(listingData.tags);
      cleanTags.forEach(tag => formData.append('tags[]', tag));
    }
    if (listingData.materials && Array.isArray(listingData.materials)) {
      const cleanMaterials = normalizeEtsyMaterials(listingData.materials);
      cleanMaterials.forEach(material => formData.append('materials[]', material));
    }
    // Shipping profile ID is required for physical listings
    if (listingData.shipping_profile_id) {
      formData.append('shipping_profile_id', listingData.shipping_profile_id.toString());
    } else if (listingData.shipping_template_id) {
      // Support legacy shipping_template_id field name
      formData.append('shipping_profile_id', listingData.shipping_template_id.toString());
    }
    // Readiness state ID is required for physical listings
    if (listingData.readiness_state_id) {
      formData.append('readiness_state_id', listingData.readiness_state_id.toString());
    }
    if (listingData.processing_min !== undefined) {
      formData.append('processing_min', listingData.processing_min.toString());
    }
    if (listingData.processing_max !== undefined) {
      formData.append('processing_max', listingData.processing_max.toString());
    }
    if (listingData.language) formData.append('language', listingData.language);
    if (listingData.is_supply !== undefined) formData.append('is_supply', listingData.is_supply.toString());
    if (listingData.is_customizable !== undefined) formData.append('is_customizable', listingData.is_customizable.toString());
    if (listingData.is_digital !== undefined) formData.append('is_digital', listingData.is_digital.toString());
    if (listingData.should_auto_renew !== undefined) formData.append('should_auto_renew', listingData.should_auto_renew.toString());
    if (listingData.is_private !== undefined) formData.append('is_private', listingData.is_private.toString());
    if (listingData.used_manufacturer !== undefined) formData.append('used_manufacturer', listingData.used_manufacturer.toString());
    if (listingData.is_vintage !== undefined) formData.append('is_vintage', listingData.is_vintage.toString());

    // Handle style field (can be string or array)
    if (listingData.style) {
      if (Array.isArray(listingData.style)) {
        listingData.style.forEach(style => formData.append('styles[]', style));
      } else {
        formData.append('styles[]', listingData.style);
      }
    }

    // Type field (physical, download, or both)
    if (listingData.type) {
      formData.append('type', listingData.type);
    }

    return this.makeRequest(`/application/shops/${shopId}/listings`, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async updateListing(listingId: string, listingData: Partial<EtsyListingData>): Promise<EtsyListingData> {
    const formData = new URLSearchParams();

    // Process all fields in listingData with explicit handling for types
    Object.entries(listingData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Handle Title normalization
      if (key === 'title' && typeof value === 'string') {
        formData.append('title', normalizeEtsyString(value));
        return;
      }

      // Handle Description normalization
      if (key === 'description' && typeof value === 'string') {
        formData.append('description', normalizeEtsyDescription(value));
        return;
      }

      // Handle Price (convert from object format if needed)
      if (key === 'price') {
        const priceValue = typeof value === 'object' && (value as any).amount !== undefined && (value as any).divisor !== undefined
          ? ((value as any).amount / (value as any).divisor).toFixed(2)
          : String(value);
        formData.append('price', priceValue);
        return;
      }

      // Handle Arrays (tags, materials, styles)
      if (Array.isArray(value)) {
        if (key === 'tags' || key === 'materials' || key === 'styles' || key === 'style') {
          const validItems = value.filter(item => item !== null && item !== undefined);
          const mappedKey = (key === 'style' || key === 'styles') ? 'styles[]' : `${key}[]`;

          let cleanItems = validItems;
          if (key === 'tags') cleanItems = normalizeEtsyTags(validItems as string[]);
          if (key === 'materials') cleanItems = normalizeEtsyMaterials(validItems as string[]);

          cleanItems.forEach(item => formData.append(mappedKey, String(item)));
        } else {
          // Other arrays
          value.forEach(item => formData.append(`${key}[]`, String(item)));
        }
        return;
      }

      // Handle Booleans
      if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false');
        return;
      }

      // Default string appending
      formData.append(key, String(value));
    });

    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}`, {
      method: 'PATCH',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
  // --- Media Library Management ---

  // Images
  async getListingImages(listingId: string): Promise<any[]> {
    const response = await this.makeRequest(`/application/listings/${listingId}/images`);
    return response.results || [];
  }

  async getListingImage(listingId: string, imageId: string): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/images/${imageId}`);
  }

  async uploadListingImage(listingId: string, imageData: FormData): Promise<any> {
    // We expect imageData to contain 'image', optional 'rank', optional 'overwrite'
    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': '' }, // Let browser set boundary
      body: imageData,
    });
  }

  async deleteListingImage(listingId: string, listingImageId: string): Promise<void> {
    await this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/images/${listingImageId}`, {
      method: 'DELETE',
    });
  }

  async updateListingImageRank(listingId: string, listingImageId: string, rank: number, overwrite: boolean = true): Promise<any> {
    const formData = new FormData();
    formData.append('listing_image_id', listingImageId);
    formData.append('rank', rank.toString());
    formData.append('overwrite', overwrite.toString());

    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': '' },
      body: formData,
    });
  }

  // Videos
  async getListingVideos(listingId: string): Promise<any[]> {
    const response = await this.makeRequest(`/application/listings/${listingId}/videos`);
    return response.results || [];
  }

  async getListingVideo(listingId: string, videoId: string): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/videos/${videoId}`);
  }

  async uploadListingVideo(listingId: string, videoData: FormData): Promise<any> {
    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': '' },
      body: videoData,
    });
  }

  async deleteListingVideo(listingId: string, videoId: string): Promise<void> {
    await this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  // Files
  async getListingFiles(listingId: string): Promise<any[]> {
    const response = await this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/files`);
    return response.results || [];
  }

  async getListingFile(listingId: string, fileId: string): Promise<any> {
    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/files/${fileId}`);
  }

  async uploadListingFile(listingId: string, fileData: FormData): Promise<any> {
    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': '' },
      body: fileData,
    });
  }

  async deleteListingFile(listingId: string, fileId: string): Promise<void> {
    await this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Variation Images
  async getVariationImages(listingId: string): Promise<any> {
    console.log(`[EtsyAPI] Getting variation images for listing ${listingId}`);
    return this.makeRequest(`/application/listings/${listingId}/variation-images`);
  }

  async updateVariationImages(listingId: string, variationImages: any[]): Promise<any> {
    return this.makeRequest(`/application/shops/${this.shopId}/listings/${listingId}/variation-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variation_images: variationImages }),
    });
  }

  // Inventory methods
  async getListingInventory(listingId: string): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/inventory`);
  }

  async updateListingInventory(listingId: string, inventoryData: any): Promise<any> {
    // Etsy API expects JSON format for inventory updates
    // Ensure all required fields are present
    // Sanitize products array to remove read-only fields
    const sanitizedProducts = (inventoryData.products || []).map((product: any) => {
      const { product_id, is_deleted, productId, ...rest } = product;

      // Also sanitize offerings
      if (rest.offerings && Array.isArray(rest.offerings)) {
        rest.offerings = rest.offerings.map((offering: any) => {
          const { offering_id, is_deleted: offeringDeleted, offeringId, ...offeringRest } = offering;

          // Convert price object to float if needed
          if (offeringRest.price && typeof offeringRest.price === 'object' && 'amount' in offeringRest.price && 'divisor' in offeringRest.price) {
            offeringRest.price = offeringRest.price.amount / offeringRest.price.divisor;
          }

          return offeringRest;
        });
      }

      // Sanitize property_values
      if (rest.property_values && Array.isArray(rest.property_values)) {
        rest.property_values = rest.property_values.map((prop: any) => {
          const { scale_name, ...propRest } = prop;
          return propRest;
        });
      }
      return rest;
    });

    const payload: any = {
      products: sanitizedProducts,
    };

    if (inventoryData.price_on_property) {
      payload.price_on_property = inventoryData.price_on_property;
    }
    if (inventoryData.quantity_on_property) {
      payload.quantity_on_property = inventoryData.quantity_on_property;
    }
    if (inventoryData.sku_on_property) {
      payload.sku_on_property = inventoryData.sku_on_property;
    }
    if (inventoryData.readiness_state_on_property) {
      payload.readiness_state_on_property = inventoryData.readiness_state_on_property;
    }

    console.log('[EtsyAPI] Updating inventory with payload:', JSON.stringify(payload, null, 2));

    return this.makeRequest(`/application/listings/${listingId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getListingProduct(listingId: string, productId: string): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/products/${productId}`);
  }

  async getListingOffering(listingId: string, productId: string, offeringId: string): Promise<any> {
    return this.makeRequest(`/application/listings/${listingId}/products/${productId}/offerings/${offeringId}`);
  }

  // Review methods
  async getShopReviews(shopId: string, limit = 100, offset = 0): Promise<any[]> {
    const response = await this.makeRequest(
      `/application/shops/${shopId}/reviews?limit=${limit}&offset=${offset}`
    );
    return response.results || [];
  }

  async getListingReviews(listingId: string, limit = 100, offset = 0): Promise<any[]> {
    const response = await this.makeRequest(
      `/application/listings/${listingId}/reviews?limit=${limit}&offset=${offset}`
    );
    return response.results || [];
  }

  // Receipt methods
  async getShopReceipts(shopId: string, options: {
    limit?: number;
    offset?: number;
    min_created?: number;
    max_created?: number;
    min_last_modified?: number;
    max_last_modified?: number;
    sort_on?: 'created' | 'updated' | 'receipt_id';
    sort_order?: 'asc' | 'desc';
    was_paid?: boolean;
    was_shipped?: boolean;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.min_created) params.append('min_created', options.min_created.toString());
    if (options.max_created) params.append('max_created', options.max_created.toString());
    if (options.min_last_modified) params.append('min_last_modified', options.min_last_modified.toString());
    if (options.max_last_modified) params.append('max_last_modified', options.max_last_modified.toString());
    if (options.sort_on) params.append('sort_on', options.sort_on);
    if (options.sort_order) params.append('sort_order', options.sort_order);
    if (options.was_paid !== undefined) params.append('was_paid', options.was_paid.toString());
    if (options.was_shipped !== undefined) params.append('was_shipped', options.was_shipped.toString());

    const queryString = params.toString();
    const endpoint = `/application/shops/${shopId}/receipts${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getShopReceipt(shopId: string, receiptId: string): Promise<any> {
    return this.makeRequest(`/application/shops/${shopId}/receipts/${receiptId}`);
  }

  // Payment methods
  async getShopPayments(shopId: string, paymentIds?: number[]): Promise<any> {
    const params = new URLSearchParams();
    if (paymentIds && paymentIds.length > 0) {
      params.append('payment_ids', paymentIds.join(','));
    }
    const queryString = params.toString();
    const endpoint = `/application/shops/${shopId}/payments${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getShopPaymentByReceiptId(shopId: string, receiptId: string): Promise<any> {
    return this.makeRequest(`/application/shops/${shopId}/receipts/${receiptId}/payments`);
  }

  // Ledger Entry methods
  async getShopLedgerEntries(shopId: string, options: {
    min_created: number;
    max_created: number;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    params.append('min_created', options.min_created.toString());
    params.append('max_created', options.max_created.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    return this.makeRequest(`/application/shops/${shopId}/payment-account/ledger-entries?${queryString}`);
  }

  async getShopLedgerEntry(shopId: string, ledgerEntryId: string): Promise<any> {
    return this.makeRequest(`/application/shops/${shopId}/payment-account/ledger-entries/${ledgerEntryId}`);
  }
}

// OAuth / PKCE helpers
function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToString(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

function generateCodeVerifier(): string {
  // 32 bytes -> 43+ char base64url string (within PKCE limits)
  return base64UrlEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncode(hash);
}

// OAuth helper functions
export async function getEtsyAuthUrl(userId?: string): Promise<string> {
  const clientId = process.env.ETSY_CLIENT_ID;
  const redirectUri = process.env.ETSY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('ETSY_CLIENT_ID and ETSY_REDIRECT_URI must be set in environment variables');
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Encode the verifier and userId into the state parameter so we can retrieve it on callback
  const statePayload: any = {
    v: codeVerifier,
  };
  if (userId) {
    statePayload.u = userId; // 'u' for userId to keep it short
  }
  const state = base64UrlEncode(Buffer.from(JSON.stringify(statePayload), 'utf8' as BufferEncoding));

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: 'listings_r listings_w listings_d shops_r shops_w transactions_r transactions_w',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://www.etsy.com/oauth/connect?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, state: string | null): Promise<EtsyAuthResponse & { userId?: string }> {
  const clientId = process.env.ETSY_CLIENT_ID;
  const redirectUri = process.env.ETSY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('ETSY_CLIENT_ID and ETSY_REDIRECT_URI must be set');
  }

  if (!state) {
    throw new Error('Missing OAuth state from Etsy');
  }

  let codeVerifier: string | undefined;
  let userId: string | undefined;
  try {
    const decoded = base64UrlDecodeToString(state);
    const parsed = JSON.parse(decoded);
    codeVerifier = parsed.v;
    userId = parsed.u; // Extract userId if present
  } catch {
    throw new Error('Invalid OAuth state returned from Etsy');
  }

  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier in OAuth state');
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
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const result: EtsyAuthResponse & { userId?: string } = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  };

  if (userId) {
    result.userId = userId;
  }

  return result;
}

export async function refreshAccessToken(refreshToken: string): Promise<EtsyAuthResponse> {
  const clientId = process.env.ETSY_CLIENT_ID;
  if (!clientId) {
    throw new Error('ETSY_CLIENT_ID must be set');
  }

  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${error}`);
  }

  return response.json();
}
