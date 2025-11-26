import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/referrals/validate?code=REF123
 * Validate a referral code (public endpoint, no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    
    // Check if referral code exists
    const referrer = await User.findOne({ referralCode: normalizedCode });
    
    if (!referrer) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid referral code' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrerName: referrer.name,
      referralCode: normalizedCode
    });

  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

