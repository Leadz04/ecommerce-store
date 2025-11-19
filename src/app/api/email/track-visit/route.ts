import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailTracking from '@/models/EmailTracking';
import EmailSubscriber from '@/models/EmailSubscriber';
import { AnalyticsEvent } from '@/models';

/**
 * Track page visits from email subscribers
 * Called when a subscriber visits any page on the site
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, page, pageType, productId, trackingId, fromEmail } = await request.json();
    
    if (!email || !page) {
      return NextResponse.json(
        { error: 'Email and page are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Determine page type if not provided
    const detectedPageType = pageType || detectPageType(page);

    // Find email tracking record if trackingId provided
    let emailTracking = null;
    if (trackingId) {
      emailTracking = await EmailTracking.findOne({
        _id: trackingId,
        email: normalizedEmail
      });
    } else {
      // Find most recent email tracking for this email
      emailTracking = await EmailTracking.findOne({
        email: normalizedEmail
      }).sort({ emailSentAt: -1 });
    }

    // Update email tracking if found
    if (emailTracking) {
      const isFirstVisit = !emailTracking.visited;
      
      await EmailTracking.findByIdAndUpdate(emailTracking._id, {
        visited: true,
        visitedAt: isFirstVisit ? now : emailTracking.visitedAt,
        $inc: { visitCount: 1 },
        lastVisitedAt: now,
        $push: {
          visitedPages: {
            page,
            visitedAt: now,
            pageType: detectedPageType,
            productId
          }
        }
      });

      // Track product view if product page
      if (productId && detectedPageType === 'product') {
        await EmailTracking.findByIdAndUpdate(emailTracking._id, {
          $push: {
            productViews: {
              productId,
              productName: '', // Can be populated later
              viewedAt: now,
              fromEmail: fromEmail || true
            }
          }
        });
      }
    }

    // Update subscriber record
    await EmailSubscriber.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          lastVisited: now
        },
        $inc: { visitCount: 1 }
      },
      { upsert: false }
    );

    // Create analytics event
    await AnalyticsEvent.create({
      type: fromEmail ? 'email_visit' : 'page_view',
      email: normalizedEmail,
      emailTrackingId: emailTracking?._id.toString(),
      page,
      pageType: detectedPageType,
      productId,
      metadata: {
        fromEmail: fromEmail || false,
        referrer: request.headers.get('referer')
      }
    });

    // Track product view separately if it's a product page
    if (productId && detectedPageType === 'product') {
      await AnalyticsEvent.create({
        type: 'product_view',
        email: normalizedEmail,
        productId,
        metadata: {
          fromEmail: fromEmail || false,
          page
        }
      });
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      emailTracking: emailTracking ? {
        id: emailTracking._id,
        visitCount: emailTracking.visitCount + 1
      } : null
    });

  } catch (error) {
    console.error('Error tracking visit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Detect page type from URL path
 */
function detectPageType(page: string): 'home' | 'product' | 'category' | 'cart' | 'checkout' | 'other' {
  if (page === '/' || page === '/home') {
    return 'home';
  }
  if (page.includes('/products/') || page.includes('/product/')) {
    return 'product';
  }
  if (page.includes('/categories/') || page.includes('/category/')) {
    return 'category';
  }
  if (page.includes('/cart')) {
    return 'cart';
  }
  if (page.includes('/checkout')) {
    return 'checkout';
  }
  return 'other';
}

