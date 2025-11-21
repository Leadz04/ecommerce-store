'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Visitor Email Tracker Component
 * 
 * This component:
 * 1. Detects if visitor's email is in our subscriber list (from cookies/localStorage)
 * 2. Tracks when they visit the site
 * 3. Tracks page visits and product views
 * 4. Tracks if they came from email (via URL params)
 * 
 * Note: This component only tracks visits. Emails should be sent manually or via scheduled jobs.
 * 
 * Usage: Add <VisitorEmailTracker /> to your layout or main page
 */
export default function VisitorEmailTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    // Only track on client side
    if (typeof window === 'undefined') return;

    // Prevent duplicate tracking
    if (tracked) return;

    // Get email from various sources (you can customize this)
    const email = getVisitorEmail();

    console.log('[VisitorEmailTracker]', {
      email,
      pathname,
      searchParams: Object.fromEntries(searchParams.entries()),
      cookies: document.cookie
    });

    if (!email) {
      console.log('[VisitorEmailTracker] No email found, skipping tracking');
      return; // No email found, can't track
    }

    // Check if visitor came from email
    const emailTrackingId = searchParams.get('email_tracking');
    const fromEmail = !!emailTrackingId || searchParams.get('utm_source') === 'email';

    // Extract product ID if on product page
    const productId = pathname.match(/\/products?\/([^/]+)/)?.[1];

    // Determine page type
    const pageType = detectPageType(pathname);

    // Mark as tracked to prevent duplicates
    setTracked(true);

    // Track visitor visit with full details
    trackVisitor(email, {
      page: pathname,
      pageType,
      productId,
      trackingId: emailTrackingId || undefined,
      fromEmail
    });
  }, [pathname, searchParams, tracked]);

  return null; // This component doesn't render anything
}

/**
 * Get visitor email from various sources
 * You can customize this to check:
 * - Cookies (from previous visits)
 * - localStorage
 * - URL parameters
 * - Form submissions
 */
function getVisitorEmail(): string | null {
  if (typeof window === 'undefined') return null;

  // Check cookies first (set by track-click or track-open endpoints)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'visitor_email' && value && isValidEmail(value)) {
      const email = decodeURIComponent(value);
      // Also store in localStorage for persistence
      localStorage.setItem('visitor_email', email);
      return email;
    }
  }

  // Check localStorage (if you store email there)
  const storedEmail = localStorage.getItem('visitor_email');
  if (storedEmail && isValidEmail(storedEmail)) {
    return storedEmail;
  }

  // Check URL parameters (if email is passed in URL)
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  if (emailParam && isValidEmail(emailParam)) {
    // Store for future visits
    localStorage.setItem('visitor_email', emailParam);
    return emailParam;
  }

  return null;
}

/**
 * Track visitor visit (no automatic email sending)
 */
async function trackVisitor(email: string, options?: {
  page?: string;
  pageType?: string;
  productId?: string;
  trackingId?: string;
  fromEmail?: boolean;
}) {
  try {
    const visitData = {
      email,
      page: options?.page || window.location.pathname,
      pageType: options?.pageType,
      productId: options?.productId,
      trackingId: options?.trackingId,
      fromEmail: options?.fromEmail || false,
    };

    console.log('[VisitorEmailTracker] Tracking visit:', visitData);

    // Track page visit
    const visitResponse = await fetch('/api/email/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });

    if (!visitResponse.ok) {
      const errorText = await visitResponse.text();
      console.error('[VisitorEmailTracker] Failed to track visit:', visitResponse.status, errorText);
    } else {
      const result = await visitResponse.json();
      console.log('[VisitorEmailTracker] Visit tracked successfully:', result);
    }

    // Also track basic visitor (for analytics, not for automatic email sending)
    const response = await fetch('/api/email/track-visitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        page: options?.page || window.location.pathname,
        referrer: document.referrer || null,
      }),
    });

    if (!response.ok) {
      // Try to get error details
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // Ignore if we can't read the response
        }
      }
      
      // Log as warning instead of error for non-critical failures
      console.warn('[VisitorEmailTracker] Failed to track visitor:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        email: email.substring(0, 3) + '***' // Partial email for debugging
      });
      return;
    }

    const data = await response.json();
    console.log('[VisitorEmailTracker] Visitor tracked:', {
      email: data.subscriber?.email,
      visitCount: data.subscriber?.visitCount,
      shouldSendEmail: data.subscriber?.shouldSendEmail // For reference only, not used for auto-sending
    });

    // Note: Email sending should be done manually via admin interface or scheduled jobs
    // We do NOT automatically send emails on every visit to avoid spam
  } catch (error) {
    // Handle network errors and other exceptions gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('[VisitorEmailTracker] Network error - visitor tracking unavailable');
    } else {
      console.warn('[VisitorEmailTracker] Error tracking visitor:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Detect page type from pathname
 */
function detectPageType(pathname: string): 'home' | 'product' | 'category' | 'cart' | 'checkout' | 'other' {
  if (pathname === '/' || pathname === '/home') {
    return 'home';
  }
  if (pathname.includes('/products/') || pathname.includes('/product/')) {
    return 'product';
  }
  if (pathname.includes('/categories/') || pathname.includes('/category/')) {
    return 'category';
  }
  if (pathname.includes('/cart')) {
    return 'cart';
  }
  if (pathname.includes('/checkout')) {
    return 'checkout';
  }
  return 'other';
}

// Removed automatic email sending - emails should be sent manually via admin interface
// or scheduled jobs, not automatically on every visit

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

