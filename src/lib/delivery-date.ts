/**
 * Calculate estimated delivery date based on shipping method and location
 */

export interface DeliveryDateOptions {
  shippingMethod?: 'standard' | 'express' | 'overnight';
  processingDays?: number; // Days to process the order
  businessDaysOnly?: boolean; // Exclude weekends
}

/**
 * Calculate estimated delivery date
 * @param options Delivery date calculation options
 * @returns Estimated delivery date
 */
export function calculateEstimatedDeliveryDate(options: DeliveryDateOptions = {}): Date {
  const {
    shippingMethod = 'standard',
    processingDays = 1,
    businessDaysOnly = true,
  } = options;

  const now = new Date();
  let deliveryDate = new Date(now);

  // Add processing days
  deliveryDate = addBusinessDays(deliveryDate, processingDays, businessDaysOnly);

  // Add shipping days based on method
  const shippingDays = getShippingDays(shippingMethod);
  deliveryDate = addBusinessDays(deliveryDate, shippingDays, businessDaysOnly);

  return deliveryDate;
}

/**
 * Get shipping days based on shipping method
 */
function getShippingDays(method: 'standard' | 'express' | 'overnight'): number {
  switch (method) {
    case 'overnight':
      return 1;
    case 'express':
      return 2;
    case 'standard':
    default:
      return 5; // Standard shipping: 5-7 business days
  }
}

/**
 * Add business days to a date
 */
function addBusinessDays(date: Date, days: number, businessDaysOnly: boolean): Date {
  const result = new Date(date);
  let daysAdded = 0;

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    
    if (businessDaysOnly) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    } else {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Format delivery date for display
 */
export function formatDeliveryDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Format as "Day, Month Date" (e.g., "Monday, January 15")
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Get delivery date range (earliest and latest)
 */
export function getDeliveryDateRange(options: DeliveryDateOptions = {}): {
  earliest: Date;
  latest: Date;
  formatted: string;
} {
  const earliest = calculateEstimatedDeliveryDate(options);
  
  // Latest date adds 2-3 extra days for standard shipping
  const latestOptions = {
    ...options,
    shippingMethod: options.shippingMethod === 'standard' ? 'standard' : options.shippingMethod,
  };
  const latest = addBusinessDays(
    earliest,
    options.shippingMethod === 'standard' ? 2 : 1,
    options.businessDaysOnly ?? true
  );

  const formatted = formatDeliveryDate(earliest);
  const latestFormatted = formatDeliveryDate(latest);

  return {
    earliest,
    latest,
    formatted: earliest.getTime() === latest.getTime()
      ? formatted
      : `${formatted} - ${latestFormatted}`,
  };
}

