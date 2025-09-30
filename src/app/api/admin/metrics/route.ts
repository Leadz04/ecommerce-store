import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { Order, Product } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW)(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 180);

    // Time window
    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - days + 1);

    // Only include paid orders in sales metrics
    const paidMatch = { paymentStatus: 'paid', createdAt: { $gte: since } } as const;

    // Aggregate revenue by day
    const revenueByDay = await Order.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // Totals
    const totals = await Order.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        }
      }
    ]);

    // Top products by revenue and units in the window
    const topProducts = await Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$product.name',
          image: '$product.image',
          revenue: 1,
          units: 1
        }
      }
    ]);

    const t = totals[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    return NextResponse.json({
      kpis: {
        totalRevenue: t.totalRevenue || 0,
        totalOrders: t.totalOrders || 0,
        avgOrderValue: t.avgOrderValue || 0,
      },
      revenueByDay,
      topProducts,
      window: { since: since.toISOString(), until: now.toISOString(), days }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
