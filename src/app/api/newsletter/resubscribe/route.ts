import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailSubscriber from '@/models/EmailSubscriber';
import { sendEmail, ADMIN_EMAIL } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await request.json();
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Find subscriber
    let subscriber = await EmailSubscriber.findOne({ email: normalizedEmail });
    
    if (!subscriber) {
      // Create new subscriber if doesn't exist
      subscriber = await EmailSubscriber.create({
        email: normalizedEmail,
        source: 'website',
        isActive: true,
        visitCount: 0,
        emailSentCount: 0,
        converted: false,
        tags: ['newsletter_subscribed', 'resubscribed']
      });
    } else {
      // Reactivate existing subscriber
      await EmailSubscriber.findByIdAndUpdate(subscriber._id, {
        isActive: true,
        $push: { tags: { $each: ['newsletter_subscribed', 'resubscribed'], $slice: -10 } },
        $set: {
          'metadata.resubscribedAt': new Date(),
          'metadata.resubscribedSource': 'website'
        }
      });
    }

    // Send welcome back email
    try {
      const resubscribeEmailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            Welcome Back to ShopEase Newsletter! 🎉
          </h2>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin-top: 0;">You're Back!</h3>
            <p style="color: #047857; margin: 0;">You've been successfully resubscribed to our newsletter. We're glad to have you back!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">What to Expect</h3>
            <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
              <li>🎁 Exclusive discounts and special offers</li>
              <li>🆕 New product announcements</li>
              <li>💡 Style tips and fashion trends</li>
              <li>⭐ Early access to sales and promotions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${siteUrl}/products" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Start Shopping</a>
          </div>
        </div>
      `;

      await sendEmail({
        to: normalizedEmail,
        subject: 'Welcome Back to ShopEase Newsletter! 🎉',
        html: resubscribeEmailHTML,
        text: `Welcome back to ShopEase Newsletter!\n\nYou've been successfully resubscribed. We're glad to have you back!\n\nVisit us at ${siteUrl}/products`
      });
      console.log('✅ [API /newsletter/resubscribe] Welcome back email sent to:', normalizedEmail);
    } catch (emailError) {
      console.error('❌ [API /newsletter/resubscribe] Failed to send welcome back email:', emailError);
    }

    // Send admin notification
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `📧 Newsletter Resubscribe: ${normalizedEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
              Newsletter Resubscribe
            </h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Subscriber Details</h3>
              <p><strong>Email:</strong> ${normalizedEmail}</p>
              <p><strong>Resubscribed At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Status:</strong> Active subscriber</p>
            </div>
          </div>
        `,
        text: `Newsletter resubscribe:\n\nEmail: ${normalizedEmail}\nResubscribed At: ${new Date().toLocaleString()}`
      });
      console.log('✅ [API /newsletter/resubscribe] Admin notification sent');
    } catch (emailError) {
      console.error('❌ [API /newsletter/resubscribe] Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'You have been successfully resubscribed to our newsletter!',
      resubscribed: true
    });

  } catch (error: any) {
    console.error('Newsletter resubscribe error:', error);
    
    return NextResponse.json(
      { error: 'Failed to resubscribe. Please try again later.' },
      { status: 500 }
    );
  }
}

