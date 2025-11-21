import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailSubscriber from '@/models/EmailSubscriber';

/**
 * Track when a subscriber visits the site
 * This endpoint is called from the frontend when a visitor's email is detected
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, page, referrer } = await request.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Update or create subscriber with visit tracking
    const subscriber = await EmailSubscriber.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          lastVisited: new Date(),
          isActive: true
        },
        $inc: {
          visitCount: 1
        },
        $setOnInsert: {
          email: normalizedEmail,
          source: 'website',
          visitCount: 1,
          emailSentCount: 0,
          converted: false
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    // Store visit metadata
    if (page || referrer) {
      const metadata = subscriber.metadata || new Map();
      if (page) metadata.set('lastPage', page);
      if (referrer) metadata.set('lastReferrer', referrer);
      metadata.set('lastVisitAt', new Date().toISOString());
      
      await EmailSubscriber.findByIdAndUpdate(subscriber._id, {
        metadata
      });
    }

    return NextResponse.json({
      success: true,
      subscriber: {
        email: subscriber.email,
        visitCount: subscriber.visitCount,
        lastVisited: subscriber.lastVisited,
        converted: subscriber.converted,
        shouldSendEmail: shouldSendConversionEmail(subscriber)
      }
    });

  } catch (error) {
    console.error('Error tracking visitor:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Handle MongoDB connection errors
      if (error.message.includes('MongoServerError') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again later.' },
          { status: 503 }
        );
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Invalid data provided' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Determine if we should send a conversion email based on visitor behavior
 */
function shouldSendConversionEmail(subscriber: any): boolean {
  // Don't send if already converted
  if (subscriber.converted) return false;

  // Don't send if email was sent recently (within 24 hours)
  if (subscriber.lastEmailSent) {
    const hoursSinceLastEmail = (Date.now() - new Date(subscriber.lastEmailSent).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastEmail < 24) return false;
  }

  // Send email if:
  // 1. First visit (visitCount === 1)
  // 2. Return visitor (visitCount === 2-3) and no email sent in 48 hours
  // 3. Multiple visits (visitCount >= 4) and no email sent in 72 hours
  
  if (subscriber.visitCount === 1) {
    return true; // First visit - send welcome email
  }

  if (subscriber.visitCount >= 2 && subscriber.visitCount <= 3) {
    if (!subscriber.lastEmailSent) return true; // Return visitor, no email sent yet
    const hoursSinceLastEmail = (Date.now() - new Date(subscriber.lastEmailSent).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastEmail >= 48; // 48 hours since last email
  }

  if (subscriber.visitCount >= 4) {
    if (!subscriber.lastEmailSent) return true;
    const hoursSinceLastEmail = (Date.now() - new Date(subscriber.lastEmailSent).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastEmail >= 72; // 72 hours since last email
  }

  return false;
}

