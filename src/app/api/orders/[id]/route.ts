import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const { id } = await params;
    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const updateData = await request.json();
    const allowedUpdates = ['status', 'trackingNumber', 'notes'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const field of allowedUpdates) {
      if ((updateData as any)[field] !== undefined) {
        filteredUpdates[field] = (updateData as any)[field];
      }
    }
    const { id } = await params;
    const order = await Order.findOneAndUpdate(
      { _id: id, userId },
      filteredUpdates,
      { new: true, runValidators: true }
    );
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Order updated successfully', order });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
