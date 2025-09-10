import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order, User } from '@/models';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);
    
    const { id } = await params;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const plain = order.toObject();
    const user = await User.findById(plain.userId).select('name email phone address');
    const transformedOrder = {
      ...plain,
      user: user ? {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: (user as any).address
      } : null,
      items: plain.items.map((item: any) => ({
        ...item,
        product: {
          _id: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          category: undefined,
          brand: undefined
        }
      }))
    };

    return NextResponse.json({ order: transformedOrder });

  } catch (error) {
    console.error('Admin order fetch error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
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
    await requirePermission(PERMISSIONS.ORDER_UPDATE)(request);
    
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
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const plain = order.toObject();
    const user = await User.findById(plain.userId).select('name email phone address');
    const transformedOrder = {
      ...plain,
      user: user ? {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: (user as any).address
      } : null,
      items: plain.items.map((item: any) => ({
        ...item,
        product: {
          _id: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          category: undefined,
          brand: undefined
        }
      }))
    };

    return NextResponse.json({ order: transformedOrder });

  } catch (error) {
    console.error('Admin order update error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
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
    await requirePermission(PERMISSIONS.ORDER_UPDATE)(request);
    
    const { id } = await params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Admin order delete error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
}
