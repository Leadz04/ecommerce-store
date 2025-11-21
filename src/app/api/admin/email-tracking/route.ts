import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailTracking from '@/models/EmailTracking';
import EmailSubscriber from '@/models/EmailSubscriber';
import Product from '@/models/Product';
import { AnalyticsEvent } from '@/models';
import jwt from 'jsonwebtoken';

async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role?: string };
  if (decoded.role !== 'admin' && decoded.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
  return decoded;
}

/**
 * Get comprehensive email tracking analytics and KPIs
 */
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Overall Email KPIs
    const totalSent = await EmailTracking.countDocuments({ emailSentAt: { $gte: since } });
    const totalOpened = await EmailTracking.countDocuments({ 
      emailSentAt: { $gte: since },
      opened: true 
    });
    const totalClicked = await EmailTracking.countDocuments({ 
      emailSentAt: { $gte: since },
      clicked: true 
    });
    const totalVisited = await EmailTracking.countDocuments({ 
      emailSentAt: { $gte: since },
      visited: true 
    });
    const totalConverted = await EmailTracking.countDocuments({ 
      emailSentAt: { $gte: since },
      converted: true 
    });

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const clickToOpenRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const visitRate = totalSent > 0 ? (totalVisited / totalSent) * 100 : 0;
    const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;

    // Average opens and clicks per email
    const avgOpens = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$openCount' } } }
    ]);
    const avgClicks = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$clickCount' } } }
    ]);
    const avgVisits = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$visitCount' } } }
    ]);

    // Performance by email type
    const performanceByType = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $group: {
        _id: '$emailType',
        totalSent: { $sum: 1 },
        totalOpened: { $sum: { $cond: ['$opened', 1, 0] } },
        totalClicked: { $sum: { $cond: ['$clicked', 1, 0] } },
        totalVisited: { $sum: { $cond: ['$visited', 1, 0] } },
        totalConverted: { $sum: { $cond: ['$converted', 1, 0] } },
        avgOpenCount: { $avg: '$openCount' },
        avgClickCount: { $avg: '$clickCount' },
        avgVisitCount: { $avg: '$visitCount' }
      }},
      { $sort: { totalSent: -1 } }
    ]);

    // Top clicked products
    const rawTopClickedProducts = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $unwind: '$clickedLinks' },
      { $match: { 'clickedLinks.linkType': 'product', 'clickedLinks.productId': { $exists: true } } },
      { $group: {
        _id: '$clickedLinks.productId',
        clickCount: { $sum: 1 },
        uniqueClickers: { $addToSet: '$email' }
      }},
      { $project: {
        productId: '$_id',
        clickCount: 1,
        uniqueClickers: { $size: '$uniqueClickers' }
      }},
      { $sort: { clickCount: -1 } },
      { $limit: 10 }
    ]);

    // Top viewed products
    const rawTopViewedProducts = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $unwind: '$productViews' },
      { $group: {
        _id: '$productViews.productId',
        viewCount: { $sum: 1 },
        uniqueViewers: { $addToSet: '$email' }
      }},
      { $project: {
        productId: '$_id',
        viewCount: 1,
        uniqueViewers: { $size: '$uniqueViewers' }
      }},
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);

    // Map product IDs to names for display
    const productIdSet = new Set<string>();
    const normalizeId = (id: any) => {
      if (!id) return null;
      return typeof id === 'string' ? id : id.toString();
    };

    rawTopClickedProducts.forEach((product) => {
      const normalized = normalizeId(product.productId);
      if (normalized) productIdSet.add(normalized);
    });
    rawTopViewedProducts.forEach((product) => {
      const normalized = normalizeId(product.productId);
      if (normalized) productIdSet.add(normalized);
    });

    let productNameMap = new Map<string, string>();
    if (productIdSet.size > 0) {
      const products = await Product.find({ _id: { $in: Array.from(productIdSet) } })
        .select('_id name')
        .lean();
      productNameMap = new Map(products.map((product) => [product._id.toString(), product.name]));
    }

    const topClickedProducts = rawTopClickedProducts.map((product) => {
      const normalizedId = normalizeId(product.productId);
      return {
        ...product,
        productId: normalizedId,
        productName: normalizedId ? productNameMap.get(normalizedId) || null : null
      };
    });

    const topViewedProducts = rawTopViewedProducts.map((product) => {
      const normalizedId = normalizeId(product.productId);
      return {
        ...product,
        productId: normalizedId,
        productName: normalizedId ? productNameMap.get(normalizedId) || null : null
      };
    });

    // Most visited pages
    const topVisitedPages = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $unwind: '$visitedPages' },
      { $group: {
        _id: '$visitedPages.page',
        visitCount: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$email' }
      }},
      { $project: {
        page: '$_id',
        visitCount: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }},
      { $sort: { visitCount: -1 } },
      { $limit: 10 }
    ]);

    // Time to open (hours)
    const timeToOpen = await EmailTracking.aggregate([
      { $match: { 
        emailSentAt: { $gte: since },
        opened: true,
        openedAt: { $exists: true }
      }},
      { $project: {
        hoursToOpen: {
          $divide: [
            { $subtract: ['$openedAt', '$emailSentAt'] },
            3600000 // milliseconds to hours
          ]
        }
      }},
      { $group: {
        _id: null,
        avgHours: { $avg: '$hoursToOpen' },
        minHours: { $min: '$hoursToOpen' },
        maxHours: { $max: '$hoursToOpen' }
      }}
    ]);

    // Time to click (hours)
    const timeToClick = await EmailTracking.aggregate([
      { $match: { 
        emailSentAt: { $gte: since },
        clicked: true,
        clickedAt: { $exists: true }
      }},
      { $project: {
        hoursToClick: {
          $divide: [
            { $subtract: ['$clickedAt', '$emailSentAt'] },
            3600000
          ]
        }
      }},
      { $group: {
        _id: null,
        avgHours: { $avg: '$hoursToClick' },
        minHours: { $min: '$hoursToClick' },
        maxHours: { $max: '$hoursToClick' }
      }}
    ]);

    // Time to visit (hours)
    const timeToVisit = await EmailTracking.aggregate([
      { $match: { 
        emailSentAt: { $gte: since },
        visited: true,
        visitedAt: { $exists: true }
      }},
      { $project: {
        hoursToVisit: {
          $divide: [
            { $subtract: ['$visitedAt', '$emailSentAt'] },
            3600000
          ]
        }
      }},
      { $group: {
        _id: null,
        avgHours: { $avg: '$hoursToVisit' },
        minHours: { $min: '$hoursToVisit' },
        maxHours: { $max: '$hoursToVisit' }
      }}
    ]);

    // Recent email activity
    const recentEmails = await EmailTracking.find({ emailSentAt: { $gte: since } })
      .sort({ emailSentAt: -1 })
      .limit(20)
      .lean();

    // Subscriber statistics
    const totalSubscribers = await EmailSubscriber.countDocuments({ isActive: true });
    const activeSubscribers = await EmailSubscriber.countDocuments({ 
      isActive: true,
      lastVisited: { $gte: since }
    });
    const convertedSubscribers = await EmailSubscriber.countDocuments({ converted: true });

    // Daily breakdown (last 7 days)
    const dailyBreakdown = await EmailTracking.aggregate([
      { $match: { emailSentAt: { $gte: since } } },
      { $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$emailSentAt' } },
        opened: { $cond: ['$opened', 1, 0] },
        clicked: { $cond: ['$clicked', 1, 0] },
        visited: { $cond: ['$visited', 1, 0] },
        converted: { $cond: ['$converted', 1, 0] }
      }},
      { $group: {
        _id: '$date',
        sent: { $sum: 1 },
        opened: { $sum: '$opened' },
        clicked: { $sum: '$clicked' },
        visited: { $sum: '$visited' },
        converted: { $sum: '$converted' }
      }},
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    return NextResponse.json({
      kpis: {
        totalSent,
        totalOpened,
        totalClicked,
        totalVisited,
        totalConverted,
        openRate: Number(openRate.toFixed(2)),
        clickRate: Number(clickRate.toFixed(2)),
        clickToOpenRate: Number(clickToOpenRate.toFixed(2)),
        visitRate: Number(visitRate.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        avgOpens: avgOpens[0]?.avg ? Number(avgOpens[0].avg.toFixed(2)) : 0,
        avgClicks: avgClicks[0]?.avg ? Number(avgClicks[0].avg.toFixed(2)) : 0,
        avgVisits: avgVisits[0]?.avg ? Number(avgVisits[0].avg.toFixed(2)) : 0
      },
      performanceByType,
      topClickedProducts,
      topViewedProducts,
      topVisitedPages,
      timeMetrics: {
        toOpen: timeToOpen[0] || null,
        toClick: timeToClick[0] || null,
        toVisit: timeToVisit[0] || null
      },
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        converted: convertedSubscribers
      },
      dailyBreakdown,
      recentEmails: recentEmails.map(e => ({
        _id: e._id,
        email: e.email,
        emailType: e.emailType,
        emailSentAt: e.emailSentAt,
        opened: e.opened,
        clicked: e.clicked,
        visited: e.visited,
        converted: e.converted,
        openCount: e.openCount,
        clickCount: e.clickCount,
        visitCount: e.visitCount
      }))
    });

  } catch (error) {
    console.error('Error fetching email tracking data:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

