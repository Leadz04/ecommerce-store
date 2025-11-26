import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CartAbandonment from '@/models/CartAbandonment';
import { sendEmail, ADMIN_EMAIL } from '@/lib/email';
import { generateCartAbandonmentEmailHTML } from '@/lib/email-templates';

/**
 * POST /api/cart/abandonment/send-recovery
 * Send cart abandonment recovery emails
 * This endpoint can be called manually or by a scheduled job
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json().catch(() => ({}));
    const { abandonmentId, hoursSinceAbandonment = 1 } = body;

    // If specific abandonment ID is provided, send email for that one
    if (abandonmentId) {
      const abandonment = await CartAbandonment.findById(abandonmentId);
      
      if (!abandonment) {
        return NextResponse.json(
          { error: 'Cart abandonment not found' },
          { status: 404 }
        );
      }

      if (abandonment.recovered) {
        return NextResponse.json(
          { error: 'Cart has already been recovered' },
          { status: 400 }
        );
      }

      if (abandonment.emailSent) {
        return NextResponse.json(
          { error: 'Recovery email has already been sent' },
          { status: 400 }
        );
      }

      if (!abandonment.userEmail) {
        return NextResponse.json(
          { error: 'No email address available for this cart' },
          { status: 400 }
        );
      }

      // Send recovery email
      const emailSent = await sendRecoveryEmail(abandonment);

      if (emailSent) {
        abandonment.emailSent = true;
        abandonment.emailSentAt = new Date();
        await abandonment.save();
      }

      return NextResponse.json({
        success: true,
        emailSent,
        message: emailSent ? 'Recovery email sent successfully' : 'Failed to send recovery email',
      });
    }

    // Otherwise, find all abandoned carts that need recovery emails
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hoursSinceAbandonment);

    const abandonedCarts = await CartAbandonment.find({
      recovered: false,
      emailSent: false,
      userEmail: { $exists: true, $ne: null },
      lastActivityAt: { $lte: hoursAgo },
    })
      .limit(50) // Process up to 50 at a time
      .lean();

    const results = {
      total: abandonedCarts.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const abandonment of abandonedCarts) {
      try {
        if (!abandonment.userEmail) {
          continue;
        }

        const emailSent = await sendRecoveryEmail(abandonment as any);

        if (emailSent) {
          await CartAbandonment.findByIdAndUpdate(abandonment._id, {
            emailSent: true,
            emailSentAt: new Date(),
          });
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send email to ${abandonment.userEmail}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing abandonment ${abandonment._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.total} abandoned carts. ${results.sent} emails sent, ${results.failed} failed.`,
    });
  } catch (error) {
    console.error('Error sending recovery emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send recovery email for an abandoned cart
 */
async function sendRecoveryEmail(abandonment: any): Promise<boolean> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cartUrl = `${siteUrl}/cart`;

    const emailHTML = generateCartAbandonmentEmailHTML({
      userName: abandonment.userEmail?.split('@')[0] || 'Customer',
      userEmail: abandonment.userEmail,
      items: abandonment.items,
      subtotal: abandonment.subtotal,
      total: abandonment.total,
      cartUrl: cartUrl,
      siteUrl: siteUrl,
    });

    const emailSent = await sendEmail({
      to: abandonment.userEmail,
      subject: 'Complete Your Purchase - Items Waiting in Your Cart',
      html: emailHTML,
    });

    return emailSent;
  } catch (error) {
    console.error('Error sending recovery email:', error);
    return false;
  }
}

