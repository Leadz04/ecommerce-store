import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId, Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ProductQuestion, { ProductAnswer } from '@/models/ProductQA';
import { User } from '@/models';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token (optional for guest answers)
async function verifyTokenOptional(request: NextRequest): Promise<{ userId: string; email: string; name: string } | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null; // Guest answers allowed
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string; name?: string };
    // Fetch user to get name
    await connectDB();
    const user = await User.findById(decoded.userId).select('name email').lean();
    return {
      userId: decoded.userId,
      email: user?.email || decoded.email,
      name: user?.name || decoded.name || decoded.email?.split('@')[0] || 'Anonymous'
    };
  } catch {
    return null; // Invalid token, treat as guest
  }
}

// POST /api/products/[id]/questions/[questionId]/answers - Create a new answer
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    await connectDB();
    const { id, questionId } = await context.params;

    if (!isValidObjectId(id) || !isValidObjectId(questionId)) {
      return NextResponse.json(
        { error: 'Invalid product or question id' },
        { status: 400 }
      );
    }

    // Verify question exists and belongs to the product
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

    const authResult = await verifyTokenOptional(request);
    const body = await request.json();
    const { answer, userName, userEmail } = body;

    // Validate required fields
    if (!answer || answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      );
    }

    if (answer.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Answer cannot be more than 2000 characters' },
        { status: 400 }
      );
    }

    // Get user info (authenticated or guest)
    let finalUserName: string;
    let finalUserEmail: string | undefined;
    let finalUserId: string | undefined;
    let isAdmin = false;

    if (authResult) {
      // Authenticated user
      finalUserId = authResult.userId;
      finalUserName = authResult.name;
      finalUserEmail = authResult.email;
      
      // Check if user is admin
      const user = await User.findById(authResult.userId).select('role').lean();
      isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    } else {
      // Guest user - require name and email
      if (!userName || userName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name is required for guest answers' },
          { status: 400 }
        );
      }
      if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        return NextResponse.json(
          { error: 'Valid email is required for guest answers' },
          { status: 400 }
        );
      }
      finalUserName = userName.trim();
      finalUserEmail = userEmail.trim().toLowerCase();
    }

    // Create answer as subdocument
    const newAnswer = {
      _id: new Types.ObjectId(),
      questionId: questionId,
      userId: finalUserId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      answer: answer.trim(),
      isAdminAnswer: isAdmin,
      status: isAdmin ? 'approved' : 'pending', // Admin answers are auto-approved
    };

    question.answers.push(newAnswer as any);
    await question.save();

    return NextResponse.json(
      { answer: newAnswer, message: isAdmin ? 'Answer posted successfully.' : 'Answer submitted successfully. It will be reviewed before being published.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

