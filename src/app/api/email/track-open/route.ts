import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailTracking from '@/models/EmailTracking';
import EmailSubscriber from '@/models/EmailSubscriber';
import { AnalyticsEvent } from '@/models';
import mongoose from 'mongoose';

/**
 * Track email opens using tracking pixel
 * This endpoint is called when the tracking pixel in the email is loaded
 * 
 * Usage: Add <img src="/api/email/track-open?token=XXX" /> to emails
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      // Return 1x1 transparent pixel even if no token (to avoid broken images)
      return new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Decode token to get email and tracking ID
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const { email, trackingId } = JSON.parse(decoded);
      
      if (!email) {
        return new NextResponse(
          Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
          {
            headers: {
              'Content-Type': 'image/gif',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const now = new Date();

      // Convert trackingId string to ObjectId
      let trackingObjectId: mongoose.Types.ObjectId;
      try {
        trackingObjectId = new mongoose.Types.ObjectId(trackingId);
      } catch (error) {
        console.error('Invalid trackingId format:', trackingId);
        // Return pixel even if invalid ID
        return new NextResponse(
          Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
          {
            headers: {
              'Content-Type': 'image/gif',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
      }

      // Find or create email tracking record
      let emailTracking = await EmailTracking.findOne({
        _id: trackingObjectId,
        email: normalizedEmail
      });

      console.log('[Email Track Open]', {
        trackingId: trackingId,
        trackingObjectId: trackingObjectId.toString(),
        email: normalizedEmail,
        found: !!emailTracking
      });

      if (!emailTracking) {
        // Create new tracking record if not found
        emailTracking = await EmailTracking.create({
          email: normalizedEmail,
          emailType: 'welcome', // Default, will be updated
          emailSentAt: now,
          opened: true,
          openedAt: now,
          openCount: 1,
          lastOpenedAt: now
        });
      } else {
        // Update existing record
        const isFirstOpen = !emailTracking.opened;
        
        await EmailTracking.findByIdAndUpdate(emailTracking._id, {
          opened: true,
          openedAt: isFirstOpen ? now : emailTracking.openedAt,
          $inc: { openCount: 1 },
          lastOpenedAt: now
        });
      }

      // Update subscriber record
      await EmailSubscriber.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: { 'metadata.lastEmailOpened': now },
          $inc: { 'metadata.emailOpenCount': 1 }
        },
        { upsert: false }
      );

      // Create analytics event
      await AnalyticsEvent.create({
        type: 'email_open',
        email: normalizedEmail,
        emailTrackingId: emailTracking._id.toString(),
        metadata: {
          emailType: emailTracking.emailType,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      });

      // Return 1x1 transparent GIF pixel with email cookie
      const response = new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      // Set cookie with email for VisitorEmailTracker to use
      response.cookies.set('visitor_email', normalizedEmail, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });

      return response;

    } catch (error) {
      console.error('Error decoding email open token:', error);
      // Still return pixel to avoid broken images
      return new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

  } catch (error) {
    console.error('Error tracking email open:', error);
    // Always return pixel to avoid broken images
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}

