import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

// Helper to verify token and get userId
async function verifyToken(request: NextRequest): Promise<string> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

// Generate a unique referral code
function generateReferralCode(userId: string, name: string): string {
  // Create code from user's name initials + userId hash
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');
  
  const hash = userId.slice(-6).toUpperCase();
  return `${initials}${hash}`;
}

/**
 * GET /api/referrals/code
 * Get or generate referral code for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user already has a referral code, return it
    if (user.referralCode) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.json({
        referralCode: user.referralCode,
        referralLink: `${siteUrl}/signup?ref=${user.referralCode}`,
        shareText: `Join me on ${siteUrl}! Use my referral code ${user.referralCode} and we both get $20 off!`
      });
    }

    // Generate a new referral code
    let referralCode = generateReferralCode(user._id.toString(), user.name);
    let attempts = 0;
    
    // Ensure uniqueness
    while (attempts < 10) {
      const existing = await User.findOne({ referralCode });
      if (!existing) break;
      referralCode = generateReferralCode(user._id.toString() + attempts, user.name);
      attempts++;
    }

    // If still not unique, use a more random approach
    if (attempts >= 10) {
      referralCode = `REF${user._id.toString().slice(-8).toUpperCase()}`;
    }

    // Save referral code to user
    user.referralCode = referralCode;
    await user.save();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: `${siteUrl}/signup?ref=${user.referralCode}`,
      shareText: `Join me on ${siteUrl}! Use my referral code ${user.referralCode} and we both get $20 off!`
    });

  } catch (error) {
    console.error('Error getting referral code:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

