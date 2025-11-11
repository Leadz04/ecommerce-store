import { NextRequest, NextResponse } from 'next/server';
import GiftCard from '@/models/GiftCard';
import connectDB from '@/lib/mongodb';

// GET - List gift cards or check balance
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');
    
    if (code) {
      // Check gift card balance
      const giftCard = await GiftCard.findOne({ code: code.toUpperCase() });
      
      if (!giftCard) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        giftCard: {
          code: giftCard.code,
          currentBalance: giftCard.currentBalance,
          currency: giftCard.currency,
          status: giftCard.status,
          isValid: giftCard.isValid(),
          expiryDate: giftCard.expiryDate
        }
      });
    }
    
    if (userId) {
      // Get user's gift cards
      const giftCards = await GiftCard.find({
        $or: [{ purchasedBy: userId }, { redeemedBy: userId }]
      }).sort({ createdAt: -1 });
      
      return NextResponse.json({ giftCards });
    }
    
    // Admin: List all gift cards
    const giftCards = await GiftCard.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json({ giftCards });
  } catch (error) {
    console.error('Error fetching gift cards:', error);
    return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
  }
}

// POST - Create/purchase a gift card
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Generate unique code
    const code = await GiftCard.generateUniqueCode();
    
    const giftCard = await GiftCard.create({
      code,
      initialBalance: body.amount,
      currentBalance: body.amount,
      currency: body.currency || 'USD',
      purchasedBy: body.userId,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      senderName: body.senderName,
      message: body.message,
      scheduledSendDate: body.scheduledSendDate,
      template: body.template || 'default',
      expiryDate: body.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    });
    
    // TODO: Send email if not scheduled or if scheduled for now
    if (!body.scheduledSendDate || new Date(body.scheduledSendDate) <= new Date()) {
      // Send gift card email
      // await sendGiftCardEmail(giftCard);
    }
    
    return NextResponse.json({ giftCard }, { status: 201 });
  } catch (error) {
    console.error('Error creating gift card:', error);
    return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 });
  }
}

