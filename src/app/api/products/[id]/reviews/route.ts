import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId, Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

// GET /api/products/[id]/reviews - Get all reviews for a product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved'; // Only show approved reviews by default
    const sortBy = searchParams.get('sortBy') || 'helpfulCount'; // Sort by helpful count by default
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const productObjectId = new Types.ObjectId(id);
    const query: any = {
      productId: productObjectId,
      status: status === 'all' ? { $in: ['pending', 'approved', 'rejected'] } : status,
    };

    const reviews = await Review.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(query);

    // Calculate average rating and total count
    const stats = await Review.aggregate([
      { $match: { productId: productObjectId, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach((rating: number) => {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      });
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.length > 0 ? {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
        ratingDistribution,
      } : {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution,
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

// POST /api/products/[id]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    let user;
    try {
      user = await verifyToken(request);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid product id' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate and convert userId to ObjectId
    let userIdObjectId: Types.ObjectId;
    try {
      if (!user.userId || user.userId === 'dev-user') {
        console.error('Invalid userId:', { userId: user.userId, user });
        return NextResponse.json(
          { error: 'Invalid user ID. Please log in again.' },
          { status: 401 }
        );
      }
      
      // Check if it's already a valid ObjectId string
      if (!isValidObjectId(user.userId)) {
        console.error('userId is not a valid ObjectId:', { userId: user.userId, type: typeof user.userId });
        return NextResponse.json(
          { error: 'Invalid user ID format. Please log in again.' },
          { status: 401 }
        );
      }
      
      userIdObjectId = new Types.ObjectId(user.userId);
    } catch (error: any) {
      console.error('Error converting userId to ObjectId:', {
        userId: user.userId,
        error: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        { error: 'Invalid user ID format. Please log in again.' },
        { status: 401 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: new Types.ObjectId(id),
      userId: userIdObjectId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, title, comment, images, verifiedPurchase } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    // Check if user has purchased this product (for verified purchase)
    const hasPurchased = verifiedPurchase || false; // TODO: Check Order model for actual purchase

    // Get user name from database if available
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(userIdObjectId);
    const userName = userDoc?.name || user.email?.split('@')[0] || 'Anonymous';
    const userEmail = userDoc?.email || user.email || '';

    // Create review
    const review = await Review.create({
      productId: new Types.ObjectId(id),
      userId: userIdObjectId,
      userName: userName,
      userEmail: userEmail,
      rating: parseInt(rating),
      title: title?.trim() || undefined,
      comment: comment.trim(),
      images: images || [],
      verifiedPurchase: hasPurchased,
      status: 'pending', // Reviews need approval
    });

    // Update product rating and review count (only if approved)
    // This will be done when admin approves the review

    return NextResponse.json({
      message: 'Review submitted successfully. It will be published after approval.',
      review,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }
    // Return more detailed error message for debugging
    const errorMessage = error.message || 'Internal server error';
    console.error('Review creation error details:', {
      message: errorMessage,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

