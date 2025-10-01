import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order, User } from '@/models';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { applyDeduplication } from '@/lib/deduplication';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requirePermission(PERMISSIONS.ORDER_VIEW_ALL)(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Get orders
    const ordersRaw = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply deduplication to ensure unique orders
    const orders = applyDeduplication(ordersRaw, 'orders');

    // Fetch related users (batch to avoid N+1 lookups)
    const uniqueUserIds = Array.from(new Set(orders.map(o => o.userId).filter(Boolean)));
    const users = await User.find({ _id: { $in: uniqueUserIds } }).select('name email');
    const userMap = new Map(users.map(u => [u._id.toString(), { _id: u._id.toString(), name: u.name, email: u.email }]));

    // Transform the data to match expected format expected by the admin UI
    const transformedOrders = orders.map(order => {
      const plain = order.toObject();
      const user = userMap.get(plain.userId?.toString()) || null;
      return {
        ...plain,
        user,
        items: plain.items.map((item: any) => ({
          ...item,
          product: {
            _id: item.productId,
            name: item.name,
            image: item.image,
            price: item.price
          }
        }))
      };
    });

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin orders fetch error:', error);
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    await requirePermission(PERMISSIONS.ORDER_UPDATE)(request);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Admin order delete error:', error);
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete order' }, { status: 500 });
  }
}
