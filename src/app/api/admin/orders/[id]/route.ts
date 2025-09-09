import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order, User } from '@/models';
import jwt from 'jsonwebtoken';

async function verifyAdminToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const user = await User.findById(decoded.userId).populate('role');
  
  if (!user || !user.permissions?.includes('system:settings')) {
    throw new Error('Admin access required');
  }

  return decoded.userId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await verifyAdminToken(request);
    
    const { id } = await params;

    const order = await Order.findById(id)
      .populate({
        path: 'userId',
        select: 'name email phone address',
        model: 'User'
      })
      .populate({
        path: 'items.productId',
        select: 'name image price category brand',
        model: 'Product'
      });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Transform the data to match expected format
    const transformedOrder = {
      ...order.toObject(),
      user: order.userId, // Rename userId to user for consistency
      items: order.items.map(item => ({
        ...item.toObject(),
        product: item.productId // Rename productId to product for consistency
      }))
    };

    return NextResponse.json({ order: transformedOrder });

  } catch (error) {
    console.error('Admin order fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await verifyAdminToken(request);
    
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'userId',
        select: 'name email phone address',
        model: 'User'
      })
      .populate({
        path: 'items.productId',
        select: 'name image price category brand',
        model: 'Product'
      });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Transform the data to match expected format
    const transformedOrder = {
      ...order.toObject(),
      user: order.userId, // Rename userId to user for consistency
      items: order.items.map(item => ({
        ...item.toObject(),
        product: item.productId // Rename productId to product for consistency
      }))
    };

    return NextResponse.json({ order: transformedOrder });

  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await verifyAdminToken(request);
    
    const { id } = await params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Admin order delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
}
