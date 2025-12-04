import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requirePermission, requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// PUT /api/admin/reviews/[reviewId] - Update review content (edit)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.REVIEW_UPDATE)(request);
    await connectDB();

    const { reviewId } = await context.params;

    if (!isValidObjectId(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
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

    // Only allow editing pending reviews
    if (review.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending reviews can be edited' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, title, comment, images } = body;

    // Validate fields
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (comment !== undefined && comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (title !== undefined) updateData.title = title?.trim() || undefined;
    if (comment !== undefined) updateData.comment = comment.trim();
    if (images !== undefined) updateData.images = images || [];

    // Update review
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

// DELETE /api/admin/reviews/[reviewId] - Delete a review
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.REVIEW_DELETE)(request);
    await connectDB();

    const { reviewId } = await context.params;

    if (!isValidObjectId(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
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

    const productId = review.productId;
    const wasApproved = review.status === 'approved';

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // If the review was approved, recalculate product rating
    if (wasApproved) {
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

    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
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

