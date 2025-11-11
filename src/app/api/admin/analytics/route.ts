import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Current month stats
    const currentMonthOrders = await Order.find({
      createdAt: { $gte: startOfMonth }
    });
    
    const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = currentMonthOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Last month stats for comparison
    const lastMonthOrders = await Order.find({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthTotalOrders = lastMonthOrders.length;
    const lastMonthAvgOrder = lastMonthTotalOrders > 0 ? lastMonthRevenue / lastMonthTotalOrders : 0;
    
    // Calculate changes
    const revenueChange = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
      : 0;
    const ordersChange = lastMonthTotalOrders > 0
      ? ((totalOrders - lastMonthTotalOrders) / lastMonthTotalOrders * 100)
      : 0;
    const avgOrderChange = lastMonthAvgOrder > 0
      ? ((avgOrderValue - lastMonthAvgOrder) / lastMonthAvgOrder * 100)
      : 0;
    
    // Customer stats
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const newCustomersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startOfMonth }
    });
    const newCustomersLastMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    
    const customersChange = newCustomersLastMonth > 0
      ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth * 100)
      : 0;
    
    // Conversion rate (orders / unique visitors)
    const uniqueVisitors = await AnalyticsEvent.distinct('sessionId', {
      createdAt: { $gte: startOfMonth }
    });
    
    const conversionRate = uniqueVisitors.length > 0
      ? (totalOrders / uniqueVisitors.length * 100)
      : 0;
    
    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      ordersChange: Math.round(ordersChange * 10) / 10,
      customersChange: Math.round(customersChange * 10) / 10,
      avgOrderChange: Math.round(avgOrderChange * 10) / 10,
      conversionRate: Math.round(conversionRate * 100) / 100,
      newCustomersThisMonth,
      period: {
        start: startOfMonth,
        end: now
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
