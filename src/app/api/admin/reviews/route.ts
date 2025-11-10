import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/reviews - Get all reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    // Check if user is admin
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (productId) {
      query.productId = productId;
    }

    const reviews = await Review.find(query)
      .populate('productId', 'name image')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reviews - Update review status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    // Check if user is admin
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { reviewId, status, adminResponse } = body;

    if (!reviewId || !status) {
      return NextResponse.json(
        { error: 'Review ID and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const oldStatus = review.status;
    review.status = status;

    if (adminResponse) {
      review.adminResponse = {
        message: adminResponse,
        respondedBy: user.userId as any,
        respondedAt: new Date(),
      };
    }

    await review.save();

    // If review was approved, update product rating and review count
    if (status === 'approved' && oldStatus !== 'approved') {
      await updateProductRating(review.productId);
    } else if (oldStatus === 'approved' && status !== 'approved') {
      // If review was unapproved, recalculate
      await updateProductRating(review.productId);
    }

    return NextResponse.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update product rating and review count
async function updateProductRating(productId: any) {
  const stats = await Review.aggregate([
    { $match: { productId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
    });
  }
}

