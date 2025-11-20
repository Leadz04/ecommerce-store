import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import EmailTracking from '@/models/EmailTracking';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * Test endpoint to manually trigger conversion tracking for debugging
 */
export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.ADMIN])(request);
    await connectDB();

    const { email, orderId, productId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Find the most recent order for this email (if orderId not provided)
    let targetOrderId = orderId;
    if (!targetOrderId) {
      const user = await User.findOne({ email: normalizedEmail }).select('_id').lean();
      if (user) {
        const recentOrder = await Order.findOne({ userId: user._id.toString() })
          .sort({ createdAt: -1 })
          .select('_id items')
          .lean();
        if (recentOrder) {
          targetOrderId = recentOrder._id.toString();
        }
      }
    }

    // Get product IDs if order found
    let productIds: string[] = [];
    if (targetOrderId) {
      const order = await Order.findById(targetOrderId).select('items').lean();
      if (order) {
        productIds = order.items.map(item => item.productId.toString());
      }
    }
    if (productId) {
      productIds.push(productId);
    }

    console.log('[Test Conversion]', {
      email: normalizedEmail,
      orderId: targetOrderId,
      productIds
    });

    // Find all promotional emails for this email
    const allPromotional = await EmailTracking.find({
      email: normalizedEmail,
      emailType: 'promotional'
    }).select('metadata.productId metadata.productName converted _id').lean();

    console.log('[Test Conversion] Found promotional emails:', {
      count: allPromotional.length,
      records: allPromotional.map(t => ({
        trackingId: t._id.toString(),
        productId: t.metadata?.productId,
        productName: t.metadata?.productName,
        converted: t.converted
      }))
    });

    // Update conversions
    const updateResult = await EmailTracking.updateMany(
      {
        email: normalizedEmail,
        emailType: 'promotional',
        converted: false
      },
      {
        $set: {
          converted: true,
          convertedAt: now,
          orderId: targetOrderId || 'manual-test'
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Conversion tracking updated',
      details: {
        email: normalizedEmail,
        orderId: targetOrderId,
        productIds,
        foundEmails: allPromotional.length,
        updated: updateResult.modifiedCount,
        matched: updateResult.matchedCount
      }
    });

  } catch (error: any) {
    console.error('[Test Conversion] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

