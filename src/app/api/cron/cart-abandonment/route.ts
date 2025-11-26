import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job endpoint for sending cart abandonment recovery emails
 * This should be called by a cron service (e.g., Vercel Cron, cron-job.org, etc.)
 * 
 * Example cron schedule: Every hour
 * 0 * * * * - Run at the top of every hour
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the recovery email endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/cart/abandonment/send-recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hoursSinceAbandonment: 1, // Send emails for carts abandoned 1+ hours ago
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to send recovery emails' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart abandonment recovery emails processed',
      results: data.results,
    });
  } catch (error) {
    console.error('Error in cart abandonment cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

