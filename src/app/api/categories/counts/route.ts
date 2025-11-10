import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Build query for active, published products
    const now = new Date();
    const query: any = { 
      isActive: true,
      $and: [
        { $or: [ { status: 'published' }, { status: { $exists: false } }, { status: null } ] },
        { $or: [ { publishAt: null }, { publishAt: { $lte: now } }, { publishAt: { $exists: false } } ] },
      ]
    };

    // Get counts for each category
    const categoryCounts = await Product.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Convert to object format
    const counts: Record<string, number> = {};
    categoryCounts.forEach(item => {
      const category = item._id || 'Unknown';
      counts[category] = item.count;
    });

    // Ensure all expected categories are present (even if 0)
    const allCategories = ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'];
    allCategories.forEach(cat => {
      if (!(cat in counts)) {
        counts[cat] = 0;
      }
    });

    return NextResponse.json({ counts });

  } catch (error) {
    console.error('Category counts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

