import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'month'; // month, week, all
    
    let startDate = new Date(0); // Beginning of time
    const now = new Date();
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Aggregate top products from orders
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['processing', 'shipped', 'delivered', 'completed'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          salesCount: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          imageUrl: { $first: '$items.productImage' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);
    
    return NextResponse.json({ products: topProducts });
  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json({ error: 'Failed to fetch top products' }, { status: 500 });
  }
}

