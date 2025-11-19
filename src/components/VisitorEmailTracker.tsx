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
 * 5. Automatically sends conversion emails based on visit behavior
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

    // Get email from various sources (you can customize this)
    const email = getVisitorEmail();

    if (!email) {
      return; // No email found, can't track
    }

    // Check if visitor came from email
    const emailTrackingId = searchParams.get('email_tracking');
    const fromEmail = !!emailTrackingId || searchParams.get('utm_source') === 'email';

    // Extract product ID if on product page
    const productId = pathname.match(/\/products?\/([^/]+)/)?.[1];

    // Determine page type
    const pageType = detectPageType(pathname);

    // Track visitor visit with full details
    trackVisitor(email, {
      page: pathname,
      pageType,
      productId,
      trackingId: emailTrackingId || undefined,
      fromEmail
    });
  }, [pathname, searchParams]);

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

  // Check localStorage (if you store email there)
  const storedEmail = localStorage.getItem('visitor_email');
  if (storedEmail && isValidEmail(storedEmail)) {
    return storedEmail;
  }

  // Check cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'visitor_email' && value && isValidEmail(value)) {
      return decodeURIComponent(value);
    }
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
 * Track visitor and trigger email if needed
 */
async function trackVisitor(email: string, options?: {
  page?: string;
  pageType?: string;
  productId?: string;
  trackingId?: string;
  fromEmail?: boolean;
}) {
  try {
    // Track page visit
    const visitResponse = await fetch('/api/email/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        page: options?.page || window.location.pathname,
        pageType: options?.pageType,
        productId: options?.productId,
        trackingId: options?.trackingId,
        fromEmail: options?.fromEmail || false,
      }),
    });

    if (!visitResponse.ok) {
      console.error('Failed to track visit');
    }

    // Also track basic visitor (for email sending logic)
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
      console.error('Failed to track visitor');
      return;
    }

    const data = await response.json();

    // If system recommends sending email, send it
    if (data.subscriber?.shouldSendEmail) {
      // Send conversion email automatically
      sendConversionEmail(email);
    }
  } catch (error) {
    console.error('Error tracking visitor:', error);
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

/**
 * Send conversion email to visitor
 */
async function sendConversionEmail(email: string) {
  try {
    const response = await fetch('/api/email/send-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        // emailType will be auto-determined based on visit count
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Conversion email sent:', data);
    }
  } catch (error) {
    console.error('Error sending conversion email:', error);
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

