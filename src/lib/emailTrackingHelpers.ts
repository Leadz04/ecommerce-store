/**
 * Helper functions for email tracking
 */

/**
 * Generate tracking token for email opens/clicks
 */
export function generateTrackingToken(email: string, trackingId: string): string {
  const data = JSON.stringify({ email, trackingId });
  return Buffer.from(data).toString('base64');
}

/**
 * Generate tracking pixel URL for email opens
 */
export function generateTrackingPixelUrl(email: string, trackingId: string, siteUrl?: string): string {
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const token = generateTrackingToken(email, trackingId);
  return `${baseUrl}/api/email/track-open?token=${token}`;
}

/**
 * Generate tracked link URL for email clicks
 */
export function generateTrackedLinkUrl(originalUrl: string, email: string, trackingId: string, siteUrl?: string): string {
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const token = generateTrackingToken(email, trackingId);
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/email/track-click?token=${token}&url=${encodedUrl}`;
}

/**
 * Wrap all links in email HTML with tracking
 */
export function wrapLinksWithTracking(html: string, email: string, trackingId: string, siteUrl?: string): string {
  if (!trackingId) return html;
  
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Find all href attributes and replace with tracked URLs
  return html.replace(
    /href=["']([^"']+)["']/gi,
    (match, url) => {
      // Don't track unsubscribe links or external links that aren't our site
      if (url.includes('unsubscribe') || url.includes('mailto:') || url.includes('tel:')) {
        return match;
      }
      
      // Only track links to our own site
      const siteDomain = new URL(baseUrl).hostname;
      try {
        const urlObj = new URL(url, baseUrl);
        if (urlObj.hostname !== siteDomain && !url.startsWith('/')) {
          return match; // External link, don't track
        }
      } catch {
        // Relative URL, track it
      }
      
      const trackedUrl = generateTrackedLinkUrl(url, email, trackingId, siteUrl);
      return `href="${trackedUrl}"`;
    }
  );
}

/**
 * Add tracking pixel to email HTML
 * Uses multiple hiding techniques to work across all email clients
 */
export function addTrackingPixel(html: string, email: string, trackingId: string, siteUrl?: string): string {
  if (!trackingId) return html;
  
  const pixelUrl = generateTrackingPixelUrl(email, trackingId, siteUrl);
  
  // Create tracking pixel with multiple hiding techniques for maximum compatibility
  // This works in Gmail, Outlook, Apple Mail, Yahoo, and other email clients
  const trackingPixel = `
    <img 
      src="${pixelUrl}" 
      width="1" 
      height="1" 
      alt="" 
      border="0" 
      style="display:block!important;width:1px!important;height:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important;visibility:hidden!important;opacity:0!important;position:absolute!important;left:-9999px!important;"
      hidden="true"
    />`;
  
  // Add tracking pixel before closing body tag
  if (html.includes('</body>')) {
    return html.replace(
      '</body>',
      `${trackingPixel}\n</body>`
    );
  }
  
  // If no body tag, add at the end
  return html + trackingPixel;
}

