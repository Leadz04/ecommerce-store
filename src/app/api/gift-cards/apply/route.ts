import { NextRequest, NextResponse } from 'next/server';
import GiftCard from '@/models/GiftCard';
import connectDB from '@/lib/mongodb';

// POST - Apply gift card to order
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { code, amount, orderId, userId } = await request.json();
    
    if (!code || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Gift card code, amount, and order ID required' },
        { status: 400 }
      );
    }
    
    const giftCard = await GiftCard.findOne({ code: code.toUpperCase() });
    
    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }
    
    if (!giftCard.isValid()) {
      let reason = 'Gift card is not valid';
      
      if (giftCard.status === 'redeemed') {
        reason = 'Gift card has been fully redeemed';
      } else if (giftCard.status === 'expired') {
        reason = 'Gift card has expired';
      } else if (giftCard.status === 'cancelled') {
        reason = 'Gift card has been cancelled';
      } else if (giftCard.currentBalance <= 0) {
        reason = 'Gift card balance is zero';
      }
      
      return NextResponse.json({ error: reason }, { status: 400 });
    }
    
    // Apply gift card
    const appliedAmount = giftCard.apply(amount, orderId);
    
    if (userId && !giftCard.redeemedBy) {
      giftCard.redeemedBy = userId;
    }
    
    await giftCard.save();
    
    return NextResponse.json({
      success: true,
      appliedAmount,
      remainingBalance: giftCard.currentBalance,
      giftCardId: giftCard._id
    });
  } catch (error) {
    console.error('Error applying gift card:', error);
    return NextResponse.json({ error: 'Failed to apply gift card' }, { status: 500 });
  }
}

