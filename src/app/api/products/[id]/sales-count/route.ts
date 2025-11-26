import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * GET /api/products/[id]/sales-count
 * Returns the count of items sold in the last 24 hours for a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Aggregate orders from the last 24 hours that contain this product
    // Only count orders with paymentStatus 'paid'
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twentyFourHoursAgo },
          paymentStatus: 'paid', // Only count paid orders
          'items.productId': id
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.productId': id
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' }
        }
      }
    ]);

    const count = result.length > 0 ? result[0].totalQuantity : 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching sales count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales count' },
      { status: 500 }
    );
  }
}

