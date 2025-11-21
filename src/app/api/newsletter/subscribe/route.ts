import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailSubscriber from '@/models/EmailSubscriber';
import { sendEmail, ADMIN_EMAIL } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, firstName, lastName } = await request.json();
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Check if already subscribed
    const existingSubscriber = await EmailSubscriber.findOne({ email: normalizedEmail });
    
    if (existingSubscriber) {
      // If already exists but inactive, reactivate
      if (!existingSubscriber.isActive) {
        await EmailSubscriber.findByIdAndUpdate(existingSubscriber._id, {
          isActive: true,
          source: 'website',
          $push: { tags: 'newsletter_subscribed' }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to our newsletter!',
        alreadySubscribed: true
      });
    }

    // Create new subscriber
    const subscriber = await EmailSubscriber.create({
      email: normalizedEmail,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      source: 'website',
      isActive: true,
      visitCount: 0,
      emailSentCount: 0,
      converted: false,
      tags: ['newsletter_subscribed']
    });

    // Send welcome email to subscriber
    try {
      const welcomeEmailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            Welcome to ShopEase Newsletter! 🎉
          </h2>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin-top: 0;">Thank You for Subscribing!</h3>
            <p style="color: #047857; margin: 0;">You've successfully subscribed to our newsletter. Get ready for exclusive deals, new product announcements, and special offers!</p>
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
          
          <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Don't want these emails?</strong> You can <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}" style="color: #3b82f6;">unsubscribe</a> at any time.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to ShopEase Newsletter! 🎉',
        html: welcomeEmailHTML,
        text: `Welcome to ShopEase Newsletter!\n\nThank you for subscribing. You'll receive exclusive deals, new product announcements, and special offers.\n\nVisit us at ${siteUrl}/products`
      });
      console.log('✅ [API /newsletter/subscribe] Welcome email sent to:', normalizedEmail);
    } catch (emailError) {
      console.error('❌ [API /newsletter/subscribe] Failed to send welcome email:', emailError);
      // Don't fail subscription if email fails
    }

    // Send admin notification
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `📧 New Newsletter Subscriber: ${normalizedEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              New Newsletter Subscriber
            </h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Subscriber Details</h3>
              <p><strong>Email:</strong> ${normalizedEmail}</p>
              ${firstName ? `<p><strong>First Name:</strong> ${firstName}</p>` : ''}
              ${lastName ? `<p><strong>Last Name:</strong> ${lastName}</p>` : ''}
              <p><strong>Source:</strong> Website Newsletter Form</p>
              <p><strong>Subscribed At:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
        text: `New newsletter subscriber:\n\nEmail: ${normalizedEmail}\n${firstName ? `First Name: ${firstName}\n` : ''}${lastName ? `Last Name: ${lastName}\n` : ''}Source: Website Newsletter Form\nSubscribed At: ${new Date().toLocaleString()}`
      });
      console.log('✅ [API /newsletter/subscribe] Admin notification sent');
    } catch (emailError) {
      console.error('❌ [API /newsletter/subscribe] Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter! Check your email for confirmation.',
      subscriber: {
        email: subscriber.email,
        subscribedAt: subscriber.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to our newsletter!',
        alreadySubscribed: true
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}

