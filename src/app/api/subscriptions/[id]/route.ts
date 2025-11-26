import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    await connectDB();
    
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid subscription id' },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({
      _id: id,
      userId: user.userId
    }).lean();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    if (error.message?.includes('No token provided') || error.message?.includes('Invalid token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    await connectDB();
    
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid subscription id' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { status, pauseUntil, cancellationReason } = data;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: user.userId
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (status === 'paused' && pauseUntil) {
      subscription.status = 'paused';
      subscription.pauseUntil = new Date(pauseUntil);
    } else if (status === 'cancelled') {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = cancellationReason;
    } else if (status === 'active') {
      subscription.status = 'active';
      subscription.pauseUntil = undefined;
    }

    await subscription.save();

    return NextResponse.json({ subscription });
  } catch (error: any) {
    if (error.message?.includes('No token provided') || error.message?.includes('Invalid token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

