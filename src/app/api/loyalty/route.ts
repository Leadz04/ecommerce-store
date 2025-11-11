import { NextRequest, NextResponse } from 'next/server';
import LoyaltyAccount, { POINTS_CONFIG } from '@/models/LoyaltyProgram';
import connectDB from '@/lib/mongodb';

// GET - Get user's loyalty account
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    let loyaltyAccount = await LoyaltyAccount.findOne({ userId });
    
    if (!loyaltyAccount) {
      // Create new loyalty account
      const referralCode = await LoyaltyAccount.generateReferralCode(userId);
      
      loyaltyAccount = await LoyaltyAccount.create({
        userId,
        referralCode,
        points: POINTS_CONFIG.signupBonus,
        lifetimePoints: POINTS_CONFIG.signupBonus,
        pointsHistory: [{
          points: POINTS_CONFIG.signupBonus,
          type: 'bonus',
          reason: 'Sign-up bonus',
          date: new Date()
        }]
      });
      
      loyaltyAccount.updateTier();
      await loyaltyAccount.save();
    }
    
    return NextResponse.json({ loyaltyAccount });
  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty account' }, { status: 500 });
  }
}

// POST - Add points or perform action
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, action, data } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    let loyaltyAccount = await LoyaltyAccount.findOne({ userId });
    
    if (!loyaltyAccount) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 });
    }
    
    switch (action) {
      case 'purchase':
        // Add points for purchase
        const purchasePoints = LoyaltyAccount.calculatePurchasePoints(data.amount);
        loyaltyAccount.addPoints(
          purchasePoints,
          `Purchase order ${data.orderId}`,
          'earned',
          data.orderId
        );
        loyaltyAccount.lifetimeSpent += data.amount;
        break;
        
      case 'review':
        // Add points for writing a review
        loyaltyAccount.addPoints(
          POINTS_CONFIG.reviewBonus,
          'Product review',
          'bonus',
          data.productId
        );
        break;
        
      case 'referral':
        // Add referral bonus
        loyaltyAccount.addPoints(
          POINTS_CONFIG.referralBonus,
          `Referred ${data.referredEmail}`,
          'bonus'
        );
        loyaltyAccount.referrals.push({
          userId: data.referredUserId,
          email: data.referredEmail,
          pointsEarned: POINTS_CONFIG.referralBonus,
          date: new Date()
        });
        break;
        
      case 'birthday':
        // Birthday bonus
        loyaltyAccount.addPoints(
          loyaltyAccount.birthdayBonus,
          'Birthday bonus',
          'bonus'
        );
        break;
        
      case 'redeem':
        // Redeem points for discount
        const success = loyaltyAccount.redeemPoints(
          data.points,
          data.reason || 'Discount redemption',
          data.orderId
        );
        
        if (!success) {
          return NextResponse.json(
            { error: 'Insufficient points' },
            { status: 400 }
          );
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    await loyaltyAccount.save();
    
    return NextResponse.json({ loyaltyAccount });
  } catch (error) {
    console.error('Error updating loyalty account:', error);
    return NextResponse.json({ error: 'Failed to update loyalty account' }, { status: 500 });
  }
}

