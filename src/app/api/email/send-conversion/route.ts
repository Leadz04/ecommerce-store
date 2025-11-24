import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailSubscriber from '@/models/EmailSubscriber';
import EmailTracking from '@/models/EmailTracking';
import EmailPromoDiscount from '@/models/EmailPromoDiscount';
import Product from '@/models/Product';
import { sendEmail } from '@/lib/email';
import {
  generateWelcomeConversionEmail,
  generateReturnVisitorEmail,
  generateUrgentConversionEmail,
  generateDiscountCode
} from '@/lib/emailTemplates';
import { addTrackingPixel, wrapLinksWithTracking } from '@/lib/emailTrackingHelpers';

/**
 * Send conversion-focused email to a subscriber
 * This is called automatically when a visitor is detected
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, emailType } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get subscriber
    const subscriber = await EmailSubscriber.findOne({ email: normalizedEmail });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Don't send if already converted
    if (subscriber.converted) {
      return NextResponse.json({
        success: false,
        message: 'Subscriber already converted'
      });
    }

    // Determine email type based on visit count if not specified
    let type = emailType;
    if (!type) {
      if (subscriber.visitCount === 1) {
        type = 'welcome';
      } else if (subscriber.visitCount >= 2 && subscriber.visitCount <= 3) {
        type = 'return';
      } else {
        type = 'urgent';
      }
    }

    // Generate discount code
    const discountCode = generateDiscountCode(type);
    const discountPercent = type === 'welcome' ? 15 : type === 'return' ? 20 : 25;

    // Get featured products for email
    const featuredProducts = await Product.find({
      isActive: true,
      status: 'published'
    })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(3)
      .lean();

    // Generate email content
    let emailHTML = '';
    let subject = '';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}`;

    // Create email tracking record BEFORE sending email
    const emailTracking = await EmailTracking.create({
      email: normalizedEmail,
      subscriberId: subscriber._id,
      emailType: type,
      emailSentAt: new Date(),
      opened: false,
      clicked: false,
      visited: false,
      converted: false,
      openCount: 0,
      clickCount: 0,
      visitCount: 0
    });

    // CRITICAL FIX: Create EmailPromoDiscount records for featured products
    // This allows the promo codes sent in emails to actually work at checkout
    const expirationDays = type === 'welcome' ? 7 : type === 'return' ? 5 : 2; // 7, 5, or 2 days
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    const promoCreationPromises = featuredProducts.map(product =>
      EmailPromoDiscount.create({
        token: discountCode,
        email: normalizedEmail,
        productId: product._id,
        discountPercent,
        trackingId: emailTracking._id,
        emailSentAt: new Date(),
        expiresAt,
        status: 'active',
        usageCount: 0,
        maxUsageCount: 1,
        usedBy: []
      })
    );

    await Promise.all(promoCreationPromises);
    console.log(`[Email Promo] Created ${featuredProducts.length} promo records for code: ${discountCode}, expires: ${expiresAt.toISOString()}`);

    const emailData = {
      email: normalizedEmail,
      firstName: subscriber.firstName,
      discountCode,
      discountPercent,
      products: featuredProducts.map(p => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image
      })),
      siteUrl,
      unsubscribeUrl,
      trackingId: emailTracking._id.toString(),
      emailType: type
    };

    switch (type) {
      case 'welcome':
        emailHTML = generateWelcomeConversionEmail(emailData);
        subject = `🎉 Welcome to ShopEase! ${discountPercent}% Off Your First Order`;
        break;
      case 'return':
        emailHTML = generateReturnVisitorEmail(emailData);
        subject = `💝 We Missed You! Exclusive ${discountPercent}% Off Just For You`;
        break;
      case 'urgent':
        emailHTML = generateUrgentConversionEmail(emailData);
        subject = `⚡ Last Chance: ${discountPercent}% Off - Expires in 48 Hours!`;
        break;
      default:
        emailHTML = generateWelcomeConversionEmail(emailData);
        subject = `🎉 Welcome to ShopEase! ${discountPercent}% Off Your First Order`;
    }

    // Add tracking pixel and wrap links with tracking
    emailHTML = wrapLinksWithTracking(emailHTML, normalizedEmail, emailTracking._id.toString(), siteUrl);
    emailHTML = addTrackingPixel(emailHTML, normalizedEmail, emailTracking._id.toString(), siteUrl);

    // Send email
    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject,
      html: emailHTML
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update subscriber record
    await EmailSubscriber.findByIdAndUpdate(subscriber._id, {
      lastEmailSent: new Date(),
      $inc: { emailSentCount: 1 },
      $push: {
        tags: {
          $each: [type, `discount_${discountCode}`],
          $slice: -10 // Keep last 10 tags
        }
      },
      'metadata.discountCode': discountCode,
      'metadata.discountPercent': discountPercent,
      'metadata.lastEmailType': type,
      'metadata.lastEmailTrackingId': emailTracking._id.toString()
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailType: type,
      discountCode,
      discountPercent,
      trackingId: emailTracking._id.toString()
    });

  } catch (error) {
    console.error('Error sending conversion email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send conversion emails to all eligible subscribers
 * Useful for batch processing
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // 'welcome', 'return', 'urgent', or 'auto'

    // Find eligible subscribers
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    let query: any = {
      isActive: true,
      converted: false
    };

    if (type === 'welcome') {
      query.visitCount = 1;
      query.$or = [
        { lastEmailSent: { $exists: false } },
        { lastEmailSent: null }
      ];
    } else if (type === 'return') {
      query.visitCount = { $gte: 2, $lte: 3 };
      query.$or = [
        { lastEmailSent: { $exists: false } },
        { lastEmailSent: null },
        { lastEmailSent: { $lte: twoDaysAgo } }
      ];
    } else if (type === 'urgent') {
      query.visitCount = { $gte: 4 };
      query.$or = [
        { lastEmailSent: { $exists: false } },
        { lastEmailSent: null },
        { lastEmailSent: { $lte: threeDaysAgo } }
      ];
    } else {
      // Auto: find all eligible
      query.$or = [
        { visitCount: 1, lastEmailSent: { $exists: false } },
        {
          visitCount: { $gte: 2, $lte: 3 }, $or: [
            { lastEmailSent: { $exists: false } },
            { lastEmailSent: { $lte: twoDaysAgo } }
          ]
        },
        {
          visitCount: { $gte: 4 }, $or: [
            { lastEmailSent: { $exists: false } },
            { lastEmailSent: { $lte: threeDaysAgo } }
          ]
        }
      ];
    }

    const subscribers = await EmailSubscriber.find(query)
      .limit(limit)
      .lean();

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each subscriber
    for (const subscriber of subscribers) {
      try {
        results.processed++;

        // Determine email type
        let emailType = type;
        if (!emailType || emailType === 'auto') {
          if (subscriber.visitCount === 1) {
            emailType = 'welcome';
          } else if (subscriber.visitCount >= 2 && subscriber.visitCount <= 3) {
            emailType = 'return';
          } else {
            emailType = 'urgent';
          }
        }

        // Send email via internal API call
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send-conversion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: subscriber.email,
            emailType
          })
        });

        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          const error = await response.json();
          results.errors.push(`${subscriber.email}: ${error.error || 'Unknown error'}`);
        }

        // Rate limiting: wait 1 second between emails to avoid Gmail limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        results.failed++;
        results.errors.push(`${subscriber.email}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error in batch email sending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

