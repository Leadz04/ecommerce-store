import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    
    const order = await Order.findOne({ _id: params.id, userId });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Order fetch error:', error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const updateData = await request.json();
    
    // Only allow certain fields to be updated
    const allowedUpdates = ['status', 'trackingNumber', 'notes'];
    const filteredUpdates: any = {};
    
    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        filteredUpdates[field] = updateData[field];
      }
    }
    
    const order = await Order.findOneAndUpdate(
      { _id: params.id, userId },
      filteredUpdates,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    console.error('Order update error:', error);
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
