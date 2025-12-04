import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requirePermission, requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/reviews - Get all reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.REVIEW_VIEW)(request);

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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate product and user data since they're stored as strings
    const User = (await import('@/models/User')).default;
    const reviewsWithPopulated = await Promise.all(
      reviews.map(async (review: any) => {
        let productData = null;
        let userData = null;

        // Fetch product data
        if (review.productId && isValidObjectId(review.productId)) {
          try {
            const product = await Product.findById(review.productId).select('name image').lean();
            if (product) {
              productData = {
                _id: product._id.toString(),
                name: product.name,
                image: product.image,
              };
            }
          } catch (err) {
            console.error(`Error fetching product ${review.productId}:`, err);
          }
        }

        // Fetch user data
        if (review.userId && isValidObjectId(review.userId)) {
          try {
            const user = await User.findById(review.userId).select('name email').lean();
            if (user) {
              userData = {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
              };
            }
          } catch (err) {
            console.error(`Error fetching user ${review.userId}:`, err);
          }
        }

        return {
          ...review,
          productId: productData || review.productId,
          userId: userData || review.userId,
        };
      })
    );

    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews: reviewsWithPopulated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    if (error instanceof Error && (error.message.includes('No token') || error.message.includes('Invalid token'))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reviews - Update review status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.REVIEW_APPROVE, PERMISSIONS.REVIEW_REJECT])(request);

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

    const review = await Review.findById(reviewId).lean();
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const oldStatus = review.status;
    
    // Build update object
    const updateData: any = {
      status,
    };

    if (adminResponse) {
      updateData.adminResponse = {
        message: adminResponse,
        respondedBy: user.userId as any,
        respondedAt: new Date(),
      };
    }

    // Use findByIdAndUpdate with $set to only update specific fields
    // This avoids validation issues with productId/userId that are already stored
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    // If review was approved, update product rating and review count
    if (status === 'approved' && oldStatus !== 'approved') {
      await updateProductRating(updatedReview.productId);
    } else if (oldStatus === 'approved' && status !== 'approved') {
      // If review was unapproved, recalculate
      await updateProductRating(updatedReview.productId);
    }

    // Send email notification to customer about review status
    if (status !== oldStatus && (status === 'approved' || status === 'rejected')) {
      try {
        const { sendEmail, generateReviewStatusEmailHTML } = await import('@/lib/email');
        const Product = (await import('@/models/Product')).default;
        const product = await Product.findById(updatedReview.productId).select('name').lean();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        
        if (updatedReview.userEmail && product) {
          const statusEmailHTML = generateReviewStatusEmailHTML({
            userName: updatedReview.userName,
            productName: product.name || 'Product',
            status: status as 'approved' | 'rejected',
            adminMessage: adminResponse,
            siteUrl
          });
          
          await sendEmail({
            to: updatedReview.userEmail,
            subject: `Review ${status === 'approved' ? 'Approved' : 'Status Update'} - ${product.name}`,
            html: statusEmailHTML,
            text: `Your review for ${product.name} has been ${status === 'approved' ? 'approved and published' : 'rejected'}.`
          });
          console.log('✅ [API /admin/reviews] Review status email sent to customer');
        }
      } catch (emailError) {
        console.error('❌ [API /admin/reviews] Failed to send review status email:', emailError);
        // Don't fail review update if email fails
      }
    }

    return NextResponse.json({
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    if (error instanceof Error && (error.message.includes('No token') || error.message.includes('Invalid token'))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
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

