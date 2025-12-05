import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';
import EmailPromoDiscount from '@/models/EmailPromoDiscount';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/coupons/stats - Get coupon statistics
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get all coupons
    const allCoupons = await Coupon.find({}).lean();
    const now = new Date();

    // Calculate stats for general coupons
    const couponStats = {
      totalCoupons: allCoupons.length,
      activeCoupons: allCoupons.filter((c: any) => 
        c.isActive && 
        c.status === 'active' && 
        c.startDate <= now && 
        c.endDate >= now &&
        (!c.usageLimit || c.usageCount < c.usageLimit)
      ).length,
      expiredCoupons: allCoupons.filter((c: any) => 
        c.status === 'expired' || c.endDate < now
      ).length,
      disabledCoupons: allCoupons.filter((c: any) => 
        c.status === 'disabled' || !c.isActive
      ).length,
      totalUsage: allCoupons.reduce((sum: number, c: any) => sum + (c.usageCount || 0), 0),
      totalDiscountGiven: allCoupons.reduce((sum: number, c: any) => sum + (c.totalDiscountGiven || 0), 0),
      totalRevenue: allCoupons.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0),
    };

    // Get orders with promo tokens (both general coupons and email promos)
    const ordersWithPromo = await Order.find({
      ...dateFilter,
      'items.promoToken': { $exists: true, $ne: null },
    }).lean();

    // Calculate revenue and discounts from orders
    let totalDiscountFromOrders = 0;
    let totalRevenueFromOrders = 0;
    const couponUsageMap: Record<string, { count: number; discount: number; revenue: number }> = {};

    ordersWithPromo.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (item.promoToken && item.promoPercent && item.promoOriginalPrice) {
          const discountAmount = (item.promoOriginalPrice * item.promoPercent) / 100;
          totalDiscountFromOrders += discountAmount;
          totalRevenueFromOrders += item.price * item.quantity;

          // Track by coupon code
          if (!couponUsageMap[item.promoToken]) {
            couponUsageMap[item.promoToken] = { count: 0, discount: 0, revenue: 0 };
          }
          couponUsageMap[item.promoToken].count += 1;
          couponUsageMap[item.promoToken].discount += discountAmount;
          couponUsageMap[item.promoToken].revenue += item.price * item.quantity;
        }
      });
    });

    // Get email promo stats
    const emailPromoStats = await EmailPromoDiscount.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      {
        $group: {
          _id: null,
          totalEmailPromos: { $sum: 1 },
          totalUsed: { $sum: '$usageCount' },
          activePromos: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'active'] }, { $gte: ['$expiresAt', now] }] },
                1,
                0
              ]
            }
          },
          expiredPromos: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$status', 'expired'] }, { $lt: ['$expiresAt', now] }] },
                1,
                0
              ]
            }
          },
        },
      },
    ]);

    const emailPromoData = emailPromoStats[0] || {
      totalEmailPromos: 0,
      totalUsed: 0,
      activePromos: 0,
      expiredPromos: 0,
    };

    // Top performing coupons
    const topCoupons = allCoupons
      .map((coupon: any) => ({
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usageCount: coupon.usageCount || 0,
        totalDiscountGiven: coupon.totalDiscountGiven || 0,
        totalRevenue: coupon.totalRevenue || 0,
        status: coupon.status,
        endDate: coupon.endDate,
        isExpired: coupon.endDate < now,
      }))
      .sort((a: any, b: any) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 10);

    // Coupon performance over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
      'items.promoToken': { $exists: true, $ne: null },
    })
      .select('createdAt items')
      .sort({ createdAt: 1 })
      .lean();

    // Group by date
    const dailyStats: Record<string, { count: number; discount: number; revenue: number }> = {};
    recentOrders.forEach((order: any) => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { count: 0, discount: 0, revenue: 0 };
      }
      order.items.forEach((item: any) => {
        if (item.promoToken && item.promoPercent && item.promoOriginalPrice) {
          const discountAmount = (item.promoOriginalPrice * item.promoPercent) / 100;
          dailyStats[dateKey].count += 1;
          dailyStats[dateKey].discount += discountAmount;
          dailyStats[dateKey].revenue += item.price * item.quantity;
        }
      });
    });

    const performanceOverTime = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      stats: {
        generalCoupons: couponStats,
        emailPromos: emailPromoData,
        overall: {
          totalDiscountGiven: couponStats.totalDiscountGiven + totalDiscountFromOrders,
          totalRevenue: couponStats.totalRevenue + totalRevenueFromOrders,
          totalCouponsUsed: couponStats.totalUsage + emailPromoData.totalUsed,
        },
        topCoupons,
        performanceOverTime,
        couponUsageMap,
      },
    });
  } catch (error: any) {
    console.error('Error fetching coupon stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch coupon statistics' },
      { status: 500 }
    );
  }
}
