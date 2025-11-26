import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId, Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ProductQuestion from '@/models/ProductQA';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token (optional)
async function verifyTokenOptional(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// PUT /api/products/[id]/questions/[questionId]/answers/[answerId]/helpful - Mark answer as helpful
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; questionId: string; answerId: string }> }
) {
  try {
    await connectDB();
    const { id, questionId, answerId } = await context.params;

    if (!isValidObjectId(id) || !isValidObjectId(questionId) || !isValidObjectId(answerId)) {
      return NextResponse.json(
        { error: 'Invalid product, question, or answer id' },
        { status: 400 }
      );
    }

    const userId = await verifyTokenOptional(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required to mark as helpful' },
        { status: 401 }
      );
    }

    const question = await ProductQuestion.findOne({
      _id: questionId,
      productId: id,
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const answer = question.answers.id(answerId);
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    // Check if user already marked as helpful
    const alreadyHelpful = answer.helpfulUsers.includes(userId);
    
    if (alreadyHelpful) {
      // Remove helpful vote
      answer.helpfulUsers = answer.helpfulUsers.filter((id: string) => id !== userId);
      answer.helpfulCount = Math.max(0, answer.helpfulCount - 1);
    } else {
      // Add helpful vote
      answer.helpfulUsers.push(userId);
      answer.helpfulCount = (answer.helpfulCount || 0) + 1;
    }

    await question.save();

    return NextResponse.json({
      helpful: !alreadyHelpful,
      helpfulCount: answer.helpfulCount,
    });
  } catch (error) {
    console.error('Error updating helpful status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

