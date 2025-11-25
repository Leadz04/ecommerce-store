import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import EmailTracking from '@/models/EmailTracking';
import EmailPromoDiscount from '@/models/EmailPromoDiscount';
import EmailSubscriber from '@/models/EmailSubscriber';
import { sendEmail } from '@/lib/email';
import { generateProductPromoEmail, ProductPromoEmailData } from '@/lib/emailTemplates';
import { addTrackingPixel, wrapLinksWithTracking } from '@/lib/emailTrackingHelpers';
import crypto from 'crypto';

const PROMO_EXPIRY_HOURS = Number(process.env.NEXT_PUBLIC_EMAIL_PROMO_EXPIRY_HOURS || process.env.EMAIL_PROMO_EXPIRY_HOURS || 72);

/**
 * Send promotional email for a specific product to selected email addresses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { id: productId } = await params;
    const body = await request.json();
    const {
      emails,
      discountPercent,
      discountCode,
      customMessage,
      subject,
      template
    } = body;
    const normalizedDiscountCode = typeof discountCode === 'string'
      ? discountCode.trim().toUpperCase()
      : '';

    // Validate inputs
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'At least one email address is required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const productUrl = `${siteUrl}/products/${productId}`;

    // Prepare base email data (per recipient tweaks happen later)
    const baseEmailData: ProductPromoEmailData = {
      productName: product.name,
      productDescription: product.description || (product as any).descriptionHtml?.replace(/<[^>]*>/g, ' ').substring(0, 200) || '',
      productPrice: product.price,
      productOriginalPrice: (product as any).originalPrice,
      productImage: product.image || '',
      productUrl,
      discountPercent,
      discountCode: normalizedDiscountCode || undefined,
      customMessage,
      siteUrl,
      template: template || 'purple',
    };

    const fallbackPreviewHtml = generateProductPromoEmail(baseEmailData);

    // Default subject if not provided
    const emailSubject = subject ||
      (discountPercent
        ? `🎉 Special Offer: ${discountPercent}% OFF ${product.name}`
        : `Check out ${product.name} - Special Offer!`);

    // Send emails to all recipients
    const results = {
      sent: [] as string[],
      failed: [] as { email: string; error: string }[],
      total: emails.length
    };

    for (const email of emails) {
      try {
        const normalizedEmail = email.toLowerCase().trim();

        // Create email tracking record BEFORE sending
        const emailTracking = await EmailTracking.create({
          email: normalizedEmail,
          emailType: 'promotional',
          emailSentAt: new Date(),
          opened: false,
          clicked: false,
          visited: false,
          converted: false,
          openCount: 0,
          clickCount: 0,
          visitCount: 0,
          metadata: {
            productId: productId,
            productName: product.name,
            discountPercent: discountPercent || null,
            customMessage: customMessage || null,
            subject: emailSubject
          }
        });

        // Update or create EmailSubscriber record for tracking
        await EmailSubscriber.findOneAndUpdate(
          { email: normalizedEmail },
          {
            $set: {
              lastEmailSent: new Date(),
              isActive: true
            },
            $inc: { emailSentCount: 1 },
            $setOnInsert: {
              email: normalizedEmail,
              source: 'promotional',
              visitCount: 0,
              converted: false
            }
          },
          { upsert: true }
        );

        let promoToken: string | null = null;
        let promoExpiresAt: Date | null = null;
        if (discountPercent && discountPercent > 0) {
          // Use custom discount code if provided, otherwise generate secure random token
          promoToken = normalizedDiscountCode || crypto.randomBytes(16).toString('hex');
          promoExpiresAt = new Date(Date.now() + PROMO_EXPIRY_HOURS * 60 * 60 * 1000);

          // CRITICAL FIX: Create EmailPromoDiscount with ALL required fields
          await EmailPromoDiscount.create({
            token: promoToken,
            email: normalizedEmail,
            productId: product._id,
            discountPercent,
            trackingId: emailTracking._id,
            emailSentAt: emailTracking.emailSentAt,
            expiresAt: promoExpiresAt,
            status: 'active',
            usageCount: 0,
            maxUsageCount: 1,
            usedBy: []
          });

          emailTracking.metadata = {
            ...(emailTracking.metadata || {}),
            promoToken,
            promoExpiresAt,
          };
          await emailTracking.save();
          console.info('[PromoEmail] Issued promo token', {
            token: promoToken,
            email: normalizedEmail,
            productId,
            discountPercent,
            expiresAt: promoExpiresAt?.toISOString(),
          });
        }

        const productLink = new URL(productUrl);
        if (promoToken) {
          productLink.searchParams.set('promo', promoToken);
        }

        const personalizedHtml = generateProductPromoEmail({
          ...baseEmailData,
          discountCode: promoToken || undefined,
          productUrl: productLink.toString(),
        });

        // Add tracking to email HTML
        let trackedHTML = wrapLinksWithTracking(personalizedHtml, normalizedEmail, emailTracking._id.toString(), siteUrl);
        trackedHTML = addTrackingPixel(trackedHTML, normalizedEmail, emailTracking._id.toString(), siteUrl);

        const emailSent = await sendEmail({
          to: normalizedEmail,
          subject: emailSubject,
          html: trackedHTML
        });

        if (emailSent) {
          results.sent.push(normalizedEmail);
          if (promoToken) {
            console.info('[PromoEmail] Email sent with promo token', { promoToken, email: normalizedEmail });
          }
        } else {
          // Delete tracking record if email failed to send
          await EmailTracking.findByIdAndDelete(emailTracking._id);
          if (promoToken) {
            await EmailPromoDiscount.deleteOne({ token: promoToken }).catch((err) => {
              console.warn('[PromoEmail] Failed cleaning promo token after send failure', { promoToken, error: err?.message });
            });
          }
          results.failed.push({
            email: normalizedEmail,
            error: 'Failed to send email'
          });
        }

        // Rate limiting: wait 500ms between emails to avoid Gmail limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        results.failed.push({
          email: email.toLowerCase().trim(),
          error: error?.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent.length} of ${results.total} emails successfully`,
      results,
      preview: {
        subject: emailSubject,
        html: fallbackPreviewHtml
      }
    });

  } catch (error: any) {
    if (error?.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.error('Error sending promotional email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Preview email template without sending
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const discountCode = searchParams.get('discountCode') || undefined;
    const discountPercent = searchParams.get('discountPercent') ? parseInt(searchParams.get('discountPercent')!) : undefined;
    const customMessage = searchParams.get('customMessage') || undefined;
    const template = (searchParams.get('template') as 'purple' | 'emerald' | 'minimal' | 'vibrant' | 'elegant') || 'purple';

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const productUrl = `${siteUrl}/products/${productId}`;

    // Prepare email data
    const emailData: ProductPromoEmailData = {
      productName: product.name,
      productDescription: product.description || (product as any).descriptionHtml?.replace(/<[^>]*>/g, ' ').substring(0, 200) || '',
      productPrice: product.price,
      productOriginalPrice: (product as any).originalPrice,
      productImage: product.image || '',
      productUrl,
      discountCode,
      discountPercent,
      customMessage,
      siteUrl,
      template,
    };

    // Generate email HTML
    const emailHTML = generateProductPromoEmail(emailData);

    const emailSubject = discountPercent
      ? `🎉 Special Offer: ${discountPercent}% OFF ${product.name}`
      : `Check out ${product.name} - Special Offer!`;

    return NextResponse.json({
      success: true,
      preview: {
        subject: emailSubject,
        html: emailHTML,
        product: {
          name: product.name,
          price: product.price,
          image: product.image
        }
      }
    });

  } catch (error: any) {
    if (error?.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

