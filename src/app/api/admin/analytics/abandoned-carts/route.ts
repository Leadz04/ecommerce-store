import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AbandonedCartAnalytics from '@/models/AbandonedCartAnalytics';
import CartAbandonment from '@/models/CartAbandonment';
import EmailTracking from '@/models/EmailTracking';
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

    const analytics = await AbandonedCartAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error fetching abandoned cart analytics:', error);
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

    // Get all abandoned carts for the date
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const abandonedCarts = await CartAbandonment.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      recovered: false
    }).lean();

    const totalAbandonedCarts = abandonedCarts.length;
    const totalCartValue = abandonedCarts.reduce((sum, cart) => sum + cart.total, 0);
    const averageCartValue = totalAbandonedCarts > 0 ? totalCartValue / totalAbandonedCarts : 0;

    // Get unique users
    const userIds = new Set(abandonedCarts.map((c: any) => c.userId).filter(Boolean));
    const userEmails = new Set(abandonedCarts.map((c: any) => c.userEmail).filter(Boolean));
    const uniqueUsers = userIds.size + userEmails.size;

    // Get recovered carts
    const recoveredCarts = await CartAbandonment.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      recovered: true
    }).lean();

    const recoveredCartsCount = recoveredCarts.length;
    const recoveredValue = recoveredCarts.reduce((sum, cart) => sum + cart.total, 0);
    const recoveryRate = totalAbandonedCarts > 0 
      ? (recoveredCartsCount / totalAbandonedCarts) * 100 
      : 0;

    // Calculate time to abandonment
    const abandonmentTimes = abandonedCarts.map((cart: any) => {
      const createdAt = new Date(cart.createdAt).getTime();
      const lastActivity = new Date(cart.lastActivityAt).getTime();
      return (lastActivity - createdAt) / (1000 * 60); // Convert to minutes
    }).filter((time: number) => time > 0);

    const averageTimeToAbandonment = abandonmentTimes.length > 0
      ? abandonmentTimes.reduce((sum: number, time: number) => sum + time, 0) / abandonmentTimes.length
      : 0;

    const medianTimeToAbandonment = abandonmentTimes.length > 0
      ? abandonmentTimes.sort((a: number, b: number) => a - b)[Math.floor(abandonmentTimes.length / 2)]
      : 0;

    // Calculate top abandoned products
    const productMap = new Map<string, { name: string; abandonmentCount: number; totalValue: number }>();
    abandonedCarts.forEach((cart: any) => {
      cart.items.forEach((item: any) => {
        const existing = productMap.get(item.productId) || { 
          name: item.productName, 
          abandonmentCount: 0, 
          totalValue: 0 
        };
        existing.abandonmentCount += 1;
        existing.totalValue += item.price * item.quantity;
        productMap.set(item.productId, existing);
      });
    });

    const topAbandonedProducts = Array.from(productMap.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        abandonmentCount: stats.abandonmentCount,
        totalValue: stats.totalValue
      }))
      .sort((a, b) => b.abandonmentCount - a.abandonmentCount)
      .slice(0, 10);

    // Email statistics
    const emailSentCarts = abandonedCarts.filter((c: any) => c.emailSent);
    const emailSentCount = emailSentCarts.length;

    // Get email tracking data for abandoned cart emails
    const emailTrackings = await EmailTracking.find({
      emailType: 'abandoned_cart',
      emailSentAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    const totalEmailsSent = emailTrackings.length;
    const openedEmails = emailTrackings.filter((e: any) => e.opened).length;
    const clickedEmails = emailTrackings.filter((e: any) => e.clicked).length;
    const visitedEmails = emailTrackings.filter((e: any) => e.visited).length;

    const emailOpenRate = totalEmailsSent > 0 ? (openedEmails / totalEmailsSent) * 100 : 0;
    const emailClickRate = totalEmailsSent > 0 ? (clickedEmails / totalEmailsSent) * 100 : 0;
    const emailConversionRate = totalEmailsSent > 0 ? (visitedEmails / totalEmailsSent) * 100 : 0;

    const analytics = await AbandonedCartAnalytics.findOneAndUpdate(
      { date: targetDate },
      {
        date: targetDate,
        totalAbandonedCarts,
        totalCartValue,
        averageCartValue,
        uniqueUsers,
        recoveryRate,
        recoveredCarts: recoveredCartsCount,
        recoveredValue,
        timeToAbandonment: {
          average: averageTimeToAbandonment,
          median: medianTimeToAbandonment
        },
        topAbandonedProducts,
        abandonmentReasons: [], // Would need to collect this data
        emailSentCount,
        emailOpenRate,
        emailClickRate,
        emailConversionRate,
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error calculating abandoned cart analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

