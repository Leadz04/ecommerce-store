import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerAnalytics from '@/models/CustomerAnalytics';
import Order from '@/models/Order';
import CartAbandonment from '@/models/CartAbandonment';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    let userRole = user.role;
    if (!userRole || userRole === 'CUSTOMER' || !userRole.includes('ADMIN')) {
      const userDoc = await User.findById(user.userId).populate('role', 'name');
      if (userDoc && userDoc.role) {
        userRole = (userDoc.role as any).name;
      }
    }
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const segment = searchParams.get('segment');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query: any = {};
    if (userId) {
      query.userId = userId;
    }
    if (segment) {
      query.customerSegment = segment;
    }

    const analytics = await CustomerAnalytics.find(query)
      .sort({ totalSpent: -1 })
      .limit(limit)
      .lean();

    // Get summary statistics
    const totalCustomers = await CustomerAnalytics.countDocuments();
    const totalRevenue = await CustomerAnalytics.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);
    const avgLifetimeValue = await CustomerAnalytics.aggregate([
      { $group: { _id: null, avg: { $avg: '$lifetimeValue' } } }
    ]);

    const segmentCounts = await CustomerAnalytics.aggregate([
      { $group: { _id: '$customerSegment', count: { $sum: 1 } } }
    ]);

    return NextResponse.json({
      analytics,
      summary: {
        totalCustomers,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageLifetimeValue: avgLifetimeValue[0]?.avg || 0,
        segmentCounts: segmentCounts.reduce((acc: any, seg: any) => {
          acc[seg._id] = seg.count;
          return acc;
        }, {})
      }
    });
  } catch (error: any) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    let userRole = user.role;
    if (!userRole || userRole === 'CUSTOMER' || !userRole.includes('ADMIN')) {
      const userDoc = await User.findById(user.userId).populate('role', 'name');
      if (userDoc && userDoc.role) {
        userRole = (userDoc.role as any).name;
      }
    }
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Calculate customer analytics from orders and cart abandonments
    const orders = await Order.find({ userId, paymentStatus: 'paid' }).lean();
    const cartAbandonments = await CartAbandonment.find({ userId }).lean();

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    const orderDates = orders.map((o: any) => new Date(o.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const firstOrderDate = orderDates[0];
    const lastOrderDate = orderDates[orderDates.length - 1];

    // Calculate favorite categories and products
    const categoryMap = new Map<string, { count: number; totalSpent: number }>();
    const productMap = new Map<string, { name: string; quantity: number; totalSpent: number }>();

    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        // Categories
        const product = orders.find((o: any) => 
          o.items.some((i: any) => i.productId === item.productId)
        );
        // This is simplified - you'd need to fetch product category from Product model
        // For now, we'll skip category tracking in this calculation
        
        // Products
        const existing = productMap.get(item.productId) || { name: item.name, quantity: 0, totalSpent: 0 };
        existing.quantity += item.quantity;
        existing.totalSpent += item.price * item.quantity;
        productMap.set(item.productId, existing);
      });
    });

    const favoriteProducts = Array.from(productMap.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        quantity: stats.quantity,
        totalSpent: stats.totalSpent
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate cart abandonment rate
    const totalCarts = cartAbandonments.length + totalOrders;
    const cartAbandonmentRate = totalCarts > 0 
      ? (cartAbandonments.length / totalCarts) * 100 
      : 0;

    // Calculate customer segment
    let customerSegment: 'new' | 'regular' | 'vip' | 'at-risk' = 'new';
    if (totalOrders >= 10 && totalSpent >= 1000) {
      customerSegment = 'vip';
    } else if (totalOrders >= 3) {
      customerSegment = 'regular';
    } else if (lastOrderDate && (Date.now() - lastOrderDate.getTime()) > 90 * 24 * 60 * 60 * 1000) {
      customerSegment = 'at-risk';
    }

    const analytics = await CustomerAnalytics.findOneAndUpdate(
      { userId },
      {
        userId,
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        firstOrderDate,
        favoriteCategories: [], // Would need product data to populate
        favoriteProducts,
        cartAbandonmentRate,
        returnRate: 0, // Would need return data
        lifetimeValue: totalSpent,
        customerSegment,
        lastActivityDate: lastOrderDate || new Date(),
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error calculating customer analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

