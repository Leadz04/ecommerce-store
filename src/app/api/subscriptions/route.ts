import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    await connectDB();
    
    const subscriptions = await Subscription.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    if (error.message?.includes('No token provided') || error.message?.includes('Invalid token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    await connectDB();
    
    const data = await request.json();
    const {
      productId,
      productName,
      productImage,
      quantity,
      price,
      frequency,
      shippingAddress,
      paymentMethod,
      totalDeliveries
    } = data;

    if (!productId || !productName || !productImage || !quantity || !price || !frequency || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate next delivery date based on frequency
    const now = new Date();
    let nextDeliveryDate = new Date(now);
    
    switch (frequency) {
      case 'weekly':
        nextDeliveryDate.setDate(now.getDate() + 7);
        break;
      case 'biweekly':
        nextDeliveryDate.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        nextDeliveryDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        nextDeliveryDate.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        nextDeliveryDate.setFullYear(now.getFullYear() + 1);
        break;
      default:
        nextDeliveryDate.setMonth(now.getMonth() + 1);
    }

    const subscription = await Subscription.create({
      userId: user.userId,
      productId,
      productName,
      productImage,
      quantity,
      price,
      frequency,
      shippingAddress,
      paymentMethod,
      totalDeliveries,
      nextDeliveryDate,
      startDate: now,
      status: 'active',
      deliveryCount: 0,
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('No token provided') || error.message?.includes('Invalid token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

