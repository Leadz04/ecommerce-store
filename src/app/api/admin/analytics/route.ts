import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AnalyticsEvent, Order, SearchEvent, User } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);

    const funnel = await AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$type', count: { $sum: 1 }, value: { $sum: { $ifNull: ['$value', 0] } } } },
    ]);

    const searchAgg = await SearchEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$query', count: { $sum: 1 }, noResults: { $sum: { $cond: [{ $eq: ['$resultsCount', 0] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const orders = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$userId', revenue: { $sum: '$total' }, orders: { $sum: 1 }, first: { $min: '$createdAt' } } },
    ]);

    // Simple cohort: group by month of first order
    const cohorts = orders.reduce((acc: Record<string, { users: number; revenue: number }>, o: any) => {
      const key = new Date(o.first).toISOString().slice(0, 7);
      if (!acc[key]) acc[key] = { users: 0, revenue: 0 };
      acc[key].users += 1;
      acc[key].revenue += o.revenue;
      return acc;
    }, {});

    const ltv = orders.length ? orders.reduce((s: number, o: any) => s + o.revenue, 0) / orders.length : 0;

    return NextResponse.json({ funnel, search: searchAgg, cohorts, ltv });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


