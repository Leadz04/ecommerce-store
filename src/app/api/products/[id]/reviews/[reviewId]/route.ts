import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import { verifyToken } from '@/lib/auth';

// PUT /api/products/[id]/reviews/[reviewId] - Update review helpful count
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; reviewId: string }> }
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
    const { reviewId } = await context.params;

    if (!isValidObjectId(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review id' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { helpful } = body; // true to mark as helpful, false to remove

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const userId = user.userId;
    const isHelpful = helpful === true;
    const hasMarkedHelpful = review.helpfulUsers.some(
      (id) => id.toString() === userId
    );

    if (isHelpful && !hasMarkedHelpful) {
      // Add helpful vote
      review.helpfulUsers.push(userId as any);
      review.helpfulCount += 1;
    } else if (!isHelpful && hasMarkedHelpful) {
      // Remove helpful vote
      review.helpfulUsers = review.helpfulUsers.filter(
        (id) => id.toString() !== userId
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    }

    await review.save();

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

// DELETE /api/products/[id]/reviews/[reviewId] - Delete a review (only by owner or admin)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; reviewId: string }> }
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
    const { reviewId } = await context.params;

    if (!isValidObjectId(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review id' },
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

    // Check if user is owner or admin
    const isOwner = review.userId.toString() === user.userId;
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own reviews' },
        { status: 403 }
      );
    }

    await Review.findByIdAndDelete(reviewId);

    // TODO: Update product rating and review count

    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

