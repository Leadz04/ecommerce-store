import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import EmailTracking from '@/models/EmailTracking';

/**
 * Get email statistics for products
 * Returns products with email counts and tracking data
 */
export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_MANAGE_INVENTORY, PERMISSIONS.ADMIN])(request);
    await connectDB();

    // Get all promotional emails grouped by product
    const productEmailStats = await EmailTracking.aggregate([
      {
        $match: {
          emailType: 'promotional',
          'metadata.productId': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$metadata.productId',
          totalSent: { $sum: 1 },
          totalOpened: {
            $sum: { $cond: ['$opened', 1, 0] }
          },
          totalClicked: {
            $sum: { $cond: ['$clicked', 1, 0] }
          },
          totalVisited: {
            $sum: { $cond: ['$visited', 1, 0] }
          },
          totalConverted: {
            $sum: { $cond: ['$converted', 1, 0] }
          },
          lastSentAt: { $max: '$emailSentAt' },
          firstSentAt: { $min: '$emailSentAt' },
          productName: { $first: '$metadata.productName' }
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: 1,
          totalSent: 1,
          totalOpened: 1,
          totalClicked: 1,
          totalVisited: 1,
          totalConverted: 1,
          lastSentAt: 1,
          firstSentAt: 1,
          openRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              { $multiply: [{ $divide: ['$totalOpened', '$totalSent'] }, 100] },
              0
            ]
          },
          clickRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              { $multiply: [{ $divide: ['$totalClicked', '$totalSent'] }, 100] },
              0
            ]
          },
          conversionRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              { $multiply: [{ $divide: ['$totalConverted', '$totalSent'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { lastSentAt: -1 }
      }
    ]);

    // Get recent promotional emails with product details
    const recentEmails = await EmailTracking.find({
      emailType: 'promotional',
      'metadata.productId': { $exists: true }
    })
      .sort({ emailSentAt: -1 })
      .limit(50)
      .lean()
      .select('email emailSentAt opened clicked visited converted openCount clickCount visitCount metadata');

    return NextResponse.json({
      success: true,
      productStats: productEmailStats,
      recentEmails: recentEmails.map(email => ({
        _id: email._id.toString(),
        email: email.email,
        emailSentAt: email.emailSentAt,
        productId: email.metadata?.productId,
        productName: email.metadata?.productName,
        opened: email.opened,
        clicked: email.clicked,
        visited: email.visited,
        converted: email.converted,
        openCount: email.openCount,
        clickCount: email.clickCount,
        visitCount: email.visitCount,
        discountCode: email.metadata?.discountCode,
        discountPercent: email.metadata?.discountPercent
      }))
    });

  } catch (error: any) {
    if (error?.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.error('Error fetching product email stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

