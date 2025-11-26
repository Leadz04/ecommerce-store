import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Referral from '@/models/Referral';

// Helper to verify token and get userId
async function verifyToken(request: NextRequest): Promise<string> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

/**
 * GET /api/referrals/stats
 * Get referral statistics for the authenticated user
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

    // Get all referrals where this user is the referrer
    const referrals = await Referral.find({ referrerId: userId })
      .populate('refereeId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const rewardedReferrals = referrals.filter(r => r.referrerRewardGranted).length;

    // Calculate total reward value (if using credits/points)
    const totalRewardValue = referrals
      .filter(r => r.referrerRewardGranted)
      .reduce((sum, r) => sum + (r.referrerRewardValue || 0), 0);

    // Get recent referrals (last 10)
    const recentReferrals = referrals.slice(0, 10).map(r => ({
      refereeName: (r.refereeId as any)?.name || 'Unknown',
      refereeEmail: (r.refereeId as any)?.email || '',
      status: r.status,
      rewardGranted: r.referrerRewardGranted,
      rewardValue: r.referrerRewardValue,
      createdAt: r.createdAt,
      firstOrderAmount: r.refereeFirstOrderAmount
    }));

    return NextResponse.json({
      referralCode: user.referralCode || null,
      stats: {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        rewardedReferrals,
        totalRewardValue
      },
      recentReferrals
    });

  } catch (error) {
    console.error('Error getting referral stats:', error);
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

