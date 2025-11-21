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
    const subscriber = await EmailSubscriber.findOne({ email: normalizedEmail });
    
    if (!subscriber) {
      return NextResponse.json({
        success: true,
        message: 'This email address is not subscribed to our newsletter.',
        alreadyUnsubscribed: true
      });
    }

    // Check if already unsubscribed
    if (!subscriber.isActive) {
      return NextResponse.json({
        success: true,
        message: 'You are already unsubscribed from our newsletter.',
        alreadyUnsubscribed: true
      });
    }

    // Unsubscribe the user
    await EmailSubscriber.findByIdAndUpdate(subscriber._id, {
      isActive: false,
      $push: { tags: 'unsubscribed' },
      $set: {
        'metadata.unsubscribedAt': new Date(),
        'metadata.unsubscribedSource': 'website'
      }
    });

    // Send confirmation email to subscriber
    try {
      const unsubscribeEmailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #6b7280; padding-bottom: 10px;">
            You've Been Unsubscribed
          </h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
            <h3 style="color: #374151; margin-top: 0;">Unsubscription Confirmed</h3>
            <p style="color: #4b5563; margin: 0;">You have been successfully unsubscribed from our newsletter. You will no longer receive marketing emails from us.</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">What This Means</h3>
            <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
              <li>You will no longer receive newsletter emails</li>
              <li>You will no longer receive promotional offers</li>
              <li>You will still receive important account-related emails (order confirmations, etc.)</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${siteUrl}" style="display: inline-block; background: #6b7280; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Return to ShopEase</a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Changed your mind?</strong> You can <a href="${siteUrl}/newsletter/resubscribe?email=${encodeURIComponent(normalizedEmail)}" style="color: #3b82f6;">resubscribe</a> at any time.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: normalizedEmail,
        subject: 'Unsubscribed from ShopEase Newsletter',
        html: unsubscribeEmailHTML,
        text: `You have been successfully unsubscribed from our newsletter.\n\nYou will no longer receive marketing emails from us.\n\nChanged your mind? Visit ${siteUrl} to resubscribe.`
      });
      console.log('✅ [API /newsletter/unsubscribe] Unsubscribe confirmation email sent to:', normalizedEmail);
    } catch (emailError) {
      console.error('❌ [API /newsletter/unsubscribe] Failed to send unsubscribe confirmation email:', emailError);
      // Don't fail unsubscription if email fails
    }

    // Send admin notification
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `📧 Newsletter Unsubscribe: ${normalizedEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #6b7280; padding-bottom: 10px;">
              Newsletter Unsubscribe
            </h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Subscriber Details</h3>
              <p><strong>Email:</strong> ${normalizedEmail}</p>
              <p><strong>Unsubscribed At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Previous Status:</strong> Active subscriber</p>
              <p><strong>Total Emails Sent:</strong> ${subscriber.emailSentCount || 0}</p>
              <p><strong>Visit Count:</strong> ${subscriber.visitCount || 0}</p>
              <p><strong>Converted:</strong> ${subscriber.converted ? 'Yes' : 'No'}</p>
            </div>
          </div>
        `,
        text: `Newsletter unsubscribe:\n\nEmail: ${normalizedEmail}\nUnsubscribed At: ${new Date().toLocaleString()}\nPrevious Status: Active subscriber\nTotal Emails Sent: ${subscriber.emailSentCount || 0}`
      });
      console.log('✅ [API /newsletter/unsubscribe] Admin notification sent');
    } catch (emailError) {
      console.error('❌ [API /newsletter/unsubscribe] Failed to send admin notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter. You will no longer receive marketing emails from us.',
      unsubscribed: true
    });

  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error);
    
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again later.' },
      { status: 500 }
    );
  }
}

