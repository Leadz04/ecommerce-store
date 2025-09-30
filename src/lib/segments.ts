import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';

export type SegmentFilter = {
  purchased?: boolean;
  daysSinceLastLoginGt?: number;
  minOrders?: number;
  categoryInterest?: string; // naive: last purchased category
};

export async function querySegment(filter: SegmentFilter) {
  await connectDB();

  // Base query for users
  const userQuery: any = {};
  if (filter.daysSinceLastLoginGt) {
    const since = new Date();
    since.setDate(since.getDate() - filter.daysSinceLastLoginGt);
    userQuery.$or = [
      { lastLoginAt: { $lt: since } },
      { lastLoginAt: { $exists: false } },
    ];
  }

  const users = await User.find(userQuery).select('email name lastLoginAt').lean();

  if (!filter.purchased && !filter.minOrders && !filter.categoryInterest) {
    return users;
  }

  const userIds = users.map((u: any) => u._id.toString());
  if (userIds.length === 0) return [];

  const orders = await Order.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $unwind: '$items' },
    { $group: { _id: '$userId', orderCount: { $sum: 1 }, lastCategory: { $last: '$items.name' } } },
  ]);

  const byUserId = new Map(orders.map((o: any) => [o._id, o]));

  return users.filter((u: any) => {
    const o = byUserId.get(u._id.toString());
    if (filter.purchased === true && !o) return false;
    if (filter.minOrders && (!o || o.orderCount < filter.minOrders)) return false;
    if (filter.categoryInterest && (!o || !String(o.lastCategory).toLowerCase().includes(filter.categoryInterest.toLowerCase()))) return false;
    return true;
  });
}


