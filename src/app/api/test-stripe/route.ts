import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
    };

    return NextResponse.json({
      message: 'Configuration check',
      config,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Configuration check failed' },
      { status: 500 }
    );
  }
}
