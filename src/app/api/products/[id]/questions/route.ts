import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId, Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ProductQuestion from '@/models/ProductQA';
import Product from '@/models/Product';
import { User } from '@/models';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token (optional for guest questions)
async function verifyTokenOptional(request: NextRequest): Promise<{ userId: string; email: string; name: string } | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null; // Guest questions allowed
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

// GET /api/products/[id]/questions - Get all approved questions and answers for a product
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
    const status = searchParams.get('status') || 'approved'; // Only show approved questions by default
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // Sort by creation date by default
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const query: any = {
      productId: id,
      status: status === 'all' ? { $in: ['pending', 'approved', 'rejected'] } : status,
    };

    const questions = await ProductQuestion.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter answers to only show approved ones
    const questionsWithApprovedAnswers = questions.map(q => ({
      ...q,
      answers: q.answers.filter((a: any) => a.status === 'approved')
    }));

    const total = await ProductQuestion.countDocuments(query);

    return NextResponse.json({
      questions: questionsWithApprovedAnswers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/questions - Create a new question
export async function POST(
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

    // Verify product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const authResult = await verifyTokenOptional(request);
    const body = await request.json();
    const { question, userName, userEmail } = body;

    // Validate required fields
    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (question.trim().length > 500) {
      return NextResponse.json(
        { error: 'Question cannot be more than 500 characters' },
        { status: 400 }
      );
    }

    // Get user info (authenticated or guest)
    let finalUserName: string;
    let finalUserEmail: string | undefined;
    let finalUserId: string | undefined;

    if (authResult) {
      // Authenticated user
      finalUserId = authResult.userId;
      finalUserName = authResult.name;
      finalUserEmail = authResult.email;
    } else {
      // Guest user - require name and email
      if (!userName || userName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name is required for guest questions' },
          { status: 400 }
        );
      }
      if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        return NextResponse.json(
          { error: 'Valid email is required for guest questions' },
          { status: 400 }
        );
      }
      finalUserName = userName.trim();
      finalUserEmail = userEmail.trim().toLowerCase();
    }

    // Create question
    const newQuestion = await ProductQuestion.create({
      productId: id,
      userId: finalUserId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      question: question.trim(),
      status: 'pending', // Questions need approval
    });

    return NextResponse.json(
      { question: newQuestion, message: 'Question submitted successfully. It will be reviewed before being published.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

