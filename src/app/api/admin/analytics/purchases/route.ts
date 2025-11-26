import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PurchaseAnalytics from '@/models/PurchaseAnalytics';
import Order from '@/models/Order';
import Product from '@/models/Product';
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query: any = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const analytics = await PurchaseAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error fetching purchase analytics:', error);
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
    
    const { date } = await request.json();
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all paid orders for the date
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItemsSold = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    );

    // Get unique customers
    const customerIds = new Set(orders.map((o: any) => o.userId).filter(Boolean));
    const uniqueCustomers = customerIds.size;

    // Get new vs returning customers
    const allPreviousOrders = await Order.find({
      paymentStatus: 'paid',
      createdAt: { $lt: startOfDay }
    }).distinct('userId').lean();

    const previousCustomerSet = new Set(allPreviousOrders.map((id: any) => id.toString()));
    let newCustomers = 0;
    let returningCustomers = 0;

    customerIds.forEach((id) => {
      if (previousCustomerSet.has(id.toString())) {
        returningCustomers++;
      } else {
        newCustomers++;
      }
    });

    // Calculate top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const existing = productMap.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        productMap.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate top categories
    const categoryMap = new Map<string, { orders: number; revenue: number }>();
    for (const order of orders) {
      for (const item of (order as any).items) {
        const product = await Product.findById(item.productId).select('category').lean();
        if (product && (product as any).category) {
          const existing = categoryMap.get((product as any).category) || { orders: 0, revenue: 0 };
          existing.orders += 1;
          existing.revenue += item.price * item.quantity;
          categoryMap.set((product as any).category, existing);
        }
      }
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        orders: stats.orders,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment methods
    const paymentMethodMap = new Map<string, { count: number; revenue: number }>();
    orders.forEach((order: any) => {
      const existing = paymentMethodMap.get(order.paymentMethod) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += order.total;
      paymentMethodMap.set(order.paymentMethod, existing);
    });

    const paymentMethods = Array.from(paymentMethodMap.entries())
      .map(([method, stats]) => ({
        method,
        count: stats.count,
        revenue: stats.revenue
      }));

    // Calculate conversion rate (simplified - would need visitor data)
    const conversionRate = 0; // Placeholder

    const analytics = await PurchaseAnalytics.findOneAndUpdate(
      { date: targetDate },
      {
        date: targetDate,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalItemsSold,
        uniqueCustomers,
        newCustomers,
        returningCustomers,
        topProducts,
        topCategories,
        paymentMethods,
        conversionRate,
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error calculating purchase analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

