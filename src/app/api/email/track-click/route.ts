import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailTracking from '@/models/EmailTracking';
import EmailSubscriber from '@/models/EmailSubscriber';
import { AnalyticsEvent } from '@/models';

/**
 * Track email link clicks and redirect to destination
 * 
 * Usage: Wrap all email links like:
 * https://yoursite.com/api/email/track-click?token=XXX&url=https://yoursite.com/products/123
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const url = searchParams.get('url');
    
    if (!token || !url) {
      // Redirect to home if missing params
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Decode token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const { email, trackingId } = JSON.parse(decoded);
      
      if (!email) {
        return NextResponse.redirect(new URL(url, request.url));
      }

      const normalizedEmail = email.toLowerCase().trim();
      const now = new Date();

      // Determine link type
      const linkType = getLinkType(url);
      const productId = extractProductId(url);

      // Find email tracking record
      let emailTracking = await EmailTracking.findOne({
        _id: trackingId,
        email: normalizedEmail
      });

      if (!emailTracking) {
        // Create if doesn't exist
        emailTracking = await EmailTracking.create({
          email: normalizedEmail,
          emailType: 'welcome',
          emailSentAt: now,
          clicked: true,
          clickedAt: now,
          clickCount: 1,
          lastClickedAt: now,
          clickedLinks: [{
            url,
            clickedAt: now,
            linkType,
            productId
          }]
        });
      } else {
        // Update existing record
        const isFirstClick = !emailTracking.clicked;
        
        await EmailTracking.findByIdAndUpdate(emailTracking._id, {
          clicked: true,
          clickedAt: isFirstClick ? now : emailTracking.clickedAt,
          $inc: { clickCount: 1 },
          lastClickedAt: now,
          $push: {
            clickedLinks: {
              url,
              clickedAt: now,
              linkType,
              productId
            }
          }
        });
      }

      // Update subscriber record
      await EmailSubscriber.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: { 'metadata.lastEmailClicked': now },
          $inc: { 'metadata.emailClickCount': 1 }
        },
        { upsert: false }
      );

      // Create analytics event
      await AnalyticsEvent.create({
        type: 'email_click',
        email: normalizedEmail,
        emailTrackingId: emailTracking._id.toString(),
        productId,
        metadata: {
          emailType: emailTracking.emailType,
          url,
          linkType,
          userAgent: request.headers.get('user-agent'),
          referrer: request.headers.get('referer')
        }
      });

      // Redirect to destination URL with tracking params
      const destinationUrl = new URL(url);
      destinationUrl.searchParams.set('utm_source', 'email');
      destinationUrl.searchParams.set('utm_medium', 'email');
      destinationUrl.searchParams.set('utm_campaign', emailTracking.emailType);
      destinationUrl.searchParams.set('email_tracking', trackingId);

      return NextResponse.redirect(destinationUrl.toString());

    } catch (error) {
      console.error('Error tracking email click:', error);
      // Still redirect to URL
      return NextResponse.redirect(new URL(url, request.url));
    }

  } catch (error) {
    console.error('Error in track-click:', error);
    const url = new URL(request.url).searchParams.get('url');
    if (url) {
      return NextResponse.redirect(new URL(url, request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
}

/**
 * Determine link type from URL
 */
function getLinkType(url: string): 'product' | 'category' | 'home' | 'checkout' | 'other' {
  if (url.includes('/products/') || url.includes('/product/')) {
    return 'product';
  }
  if (url.includes('/categories/') || url.includes('/category/')) {
    return 'category';
  }
  if (url.includes('/checkout') || url.includes('/cart')) {
    return 'checkout';
  }
  if (url === '/' || url.endsWith('/')) {
    return 'home';
  }
  return 'other';
}

/**
 * Extract product ID from URL
 */
function extractProductId(url: string): string | undefined {
  const match = url.match(/\/products?\/([^/?]+)/);
  return match ? match[1] : undefined;
}

