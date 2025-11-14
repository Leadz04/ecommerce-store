import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  console.log('[API /categories/counts] GET request received');
  try {
    console.log('[API /categories/counts] Connecting to database...');
    await connectDB();
    console.log('[API /categories/counts] Database connected successfully');
    
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
    console.log('[API /categories/counts] Executing aggregation...');
    const categoryCounts = await Product.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('[API /categories/counts] Found', categoryCounts.length, 'categories');
    
    // Convert to object format
    const counts: Record<string, number> = {};
    categoryCounts.forEach(item => {
      const category = item._id || 'Unknown';
      counts[category] = item.count;
      console.log(`[API /categories/counts] ${category}: ${item.count} products`);
    });

    // Ensure all expected categories are present (even if 0)
    const allCategories = ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'];
    allCategories.forEach(cat => {
      if (!(cat in counts)) {
        counts[cat] = 0;
      }
    });

    console.log('[API /categories/counts] Success - Returning counts');
    return NextResponse.json({ counts });

  } catch (error) {
    console.error('❌ [API /categories/counts] Error:', error);
    console.error('[API /categories/counts] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

