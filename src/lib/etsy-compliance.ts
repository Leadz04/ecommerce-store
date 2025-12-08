/**
 * Etsy API Terms of Use Compliance Utilities
 * 
 * This module provides utilities to ensure compliance with Etsy's API Terms:
 * - Data freshness validation (6 hours for listings, 24 hours for other content)
 * - Rate limit tracking
 * - Compliance checking
 */

// Etsy API Terms requirements
export const ETSY_DATA_FRESHNESS = {
  LISTING_CONTENT: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  OTHER_CONTENT: 24 * 60 * 60 * 1000,  // 24 hours in milliseconds
} as const;

export type EtsyContentType = 'listing' | 'shop' | 'order' | 'inventory' | 'other';

/**
 * Check if Etsy data is still fresh according to API Terms
 * @param lastSyncedAt - Timestamp when data was last synced
 * @param contentType - Type of content (listing or other)
 * @returns true if data is fresh, false if stale
 */
export function isEtsyDataFresh(
  lastSyncedAt: Date | string | number | null | undefined,
  contentType: EtsyContentType = 'other'
): boolean {
  if (!lastSyncedAt) {
    return false; // No sync timestamp means data is stale
  }

  const lastSyncTime = typeof lastSyncedAt === 'string' 
    ? new Date(lastSyncedAt).getTime()
    : typeof lastSyncedAt === 'number'
    ? lastSyncedAt
    : lastSyncedAt.getTime();

  const now = Date.now();
  const maxAge = contentType === 'listing' 
    ? ETSY_DATA_FRESHNESS.LISTING_CONTENT 
    : ETSY_DATA_FRESHNESS.OTHER_CONTENT;

  const age = now - lastSyncTime;
  return age <= maxAge;
}

/**
 * Get the age of Etsy data in milliseconds
 * @param lastSyncedAt - Timestamp when data was last synced
 * @returns Age in milliseconds, or null if no timestamp
 */
export function getEtsyDataAge(
  lastSyncedAt: Date | string | number | null | undefined
): number | null {
  if (!lastSyncedAt) {
    return null;
  }

  const lastSyncTime = typeof lastSyncedAt === 'string' 
    ? new Date(lastSyncedAt).getTime()
    : typeof lastSyncedAt === 'number'
    ? lastSyncedAt
    : lastSyncedAt.getTime();

  return Date.now() - lastSyncTime;
}

/**
 * Get the maximum age allowed for a content type
 * @param contentType - Type of content
 * @returns Maximum age in milliseconds
 */
export function getMaxAgeForContentType(contentType: EtsyContentType): number {
  return contentType === 'listing' 
    ? ETSY_DATA_FRESHNESS.LISTING_CONTENT 
    : ETSY_DATA_FRESHNESS.OTHER_CONTENT;
}

/**
 * Check if data needs refresh based on content type
 * @param lastSyncedAt - Timestamp when data was last synced
 * @param contentType - Type of content
 * @returns true if data needs refresh
 */
export function needsEtsyDataRefresh(
  lastSyncedAt: Date | string | number | null | undefined,
  contentType: EtsyContentType = 'other'
): boolean {
  return !isEtsyDataFresh(lastSyncedAt, contentType);
}

/**
 * Rate limit tracking for Etsy API
 */
export class EtsyRateLimiter {
  private static instance: EtsyRateLimiter;
  private apiCallCount: number = 0;
  private dailyResetTime: number;
  private perSecondCalls: number[] = [];
  private readonly MAX_PER_SECOND = 10; // Default rate limit (verify with Etsy docs)

  private constructor() {
    // Reset daily at midnight UTC
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    this.dailyResetTime = tomorrow.getTime();
  }

  static getInstance(): EtsyRateLimiter {
    if (!EtsyRateLimiter.instance) {
      EtsyRateLimiter.instance = new EtsyRateLimiter();
    }
    return EtsyRateLimiter.instance;
  }

  /**
   * Check if we can make an API call (rate limit not exceeded)
   * @returns true if call can be made
   */
  canMakeRequest(): boolean {
    this.checkDailyReset();
    this.cleanOldPerSecondCalls();

    // Check per-second limit
    if (this.perSecondCalls.length >= this.MAX_PER_SECOND) {
      return false;
    }

    return true;
  }

  /**
   * Record an API call
   */
  recordCall(): void {
    this.checkDailyReset();
    this.cleanOldPerSecondCalls();
    
    this.apiCallCount++;
    this.perSecondCalls.push(Date.now());
  }

  /**
   * Get remaining calls for current second
   */
  getRemainingCallsThisSecond(): number {
    this.cleanOldPerSecondCalls();
    return Math.max(0, this.MAX_PER_SECOND - this.perSecondCalls.length);
  }

  /**
   * Wait if necessary to respect rate limits
   */
  async waitIfNeeded(): Promise<void> {
    if (!this.canMakeRequest()) {
      const oldestCall = this.perSecondCalls[0];
      const waitTime = 1000 - (Date.now() - oldestCall) + 10; // Add 10ms buffer
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.cleanOldPerSecondCalls();
      }
    }
  }

  private checkDailyReset(): void {
    if (Date.now() >= this.dailyResetTime) {
      this.apiCallCount = 0;
      // Reset to next midnight UTC
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      this.dailyResetTime = tomorrow.getTime();
    }
  }

  private cleanOldPerSecondCalls(): void {
    const oneSecondAgo = Date.now() - 1000;
    this.perSecondCalls = this.perSecondCalls.filter(timestamp => timestamp > oneSecondAgo);
  }

  getDailyCallCount(): number {
    this.checkDailyReset();
    return this.apiCallCount;
  }
}

/**
 * Required Etsy trademark disclaimer text
 */
export const ETSY_TRADEMARK_DISCLAIMER = 
  "The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or certified by Etsy.";

/**
 * Required warranty disclaimer text for Application Terms
 */
export const ETSY_WARRANTY_DISCLAIMER = (developerName: string) => 
  `DISCLAIMER: THIS APPLICATION IS SOLELY PROVIDED BY ${developerName.toUpperCase()} (THE "APPLICATION DEVELOPER"). YOU ACKNOWLEDGE THAT ETSY, INC. AND ITS AFFILIATES ARE NOT THE APPLICATION DEVELOPER, DO NOT PROVIDE THE APPLICATION SERVICE, AND MAKE NO WARRANTIES OF ANY KIND WITH RESPECT TO THE APPLICATION OR DATA ACCESSED THROUGH IT.`;

/**
 * Support email for Etsy sellers
 * Can be your existing support email - Etsy only requires it to be monitored and responsive
 */
export const ETSY_SUPPORT_EMAIL = process.env.ETSY_SUPPORT_EMAIL || 'testleadz04@gmail.com';
