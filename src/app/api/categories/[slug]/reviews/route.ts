import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';

// GET /api/categories/[slug]/reviews - Get reviews for products in a category
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await context.params;

    // Map slug to category name
    const categoryMap: Record<string, string> = {
      'men': 'Men',
      'women': 'Women',
      'children': 'Children',
      'office-travel': 'Office & Travel',
      'accessories': 'Accessories',
      'gifting': 'Gifting'
    };

    const categoryName = categoryMap[slug as keyof typeof categoryMap];
    if (!categoryName) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get product IDs for this category
    const products = await Product.find({ 
      category: categoryName,
      isActive: true
    }).select('_id').lean();

    const productIds = products.map(p => p._id);

    if (productIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Get reviews for products in this category
    const query: any = {
      productId: { $in: productIds },
      status: 'approved'
    };

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name image category')
      .lean();

    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching category reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
