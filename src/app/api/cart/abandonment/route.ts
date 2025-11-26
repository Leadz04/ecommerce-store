import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CartAbandonment from '@/models/CartAbandonment';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token (optional)
async function verifyTokenOptional(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

// POST /api/cart/abandonment - Track cart abandonment
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const authResult = await verifyTokenOptional(request);
    const body = await request.json();
    const { items, subtotal, total, userEmail, sessionId } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (typeof subtotal !== 'number' || typeof total !== 'number') {
      return NextResponse.json(
        { error: 'Subtotal and total are required' },
        { status: 400 }
      );
    }

    // Get user email (from auth or body)
    const email = authResult?.email || userEmail;
    if (!email && !sessionId) {
      return NextResponse.json(
        { error: 'User email or session ID is required' },
        { status: 400 }
      );
    }

    // Check if there's an existing abandonment record
    const query: any = {};
    if (authResult?.userId) {
      query.userId = authResult.userId;
    } else if (email) {
      query.userEmail = email.toLowerCase().trim();
    } else if (sessionId) {
      query.sessionId = sessionId;
    }

    // Find existing record that hasn't been recovered
    const existing = await CartAbandonment.findOne({
      ...query,
      recovered: false,
    });

    if (existing) {
      // Update existing record
      existing.items = items;
      existing.subtotal = subtotal;
      existing.total = total;
      existing.lastActivityAt = new Date();
      if (email && !existing.userEmail) {
        existing.userEmail = email.toLowerCase().trim();
      }
      await existing.save();
      return NextResponse.json({ 
        success: true, 
        abandonmentId: existing._id,
        message: 'Cart abandonment updated' 
      });
    } else {
      // Create new record
      const abandonment = await CartAbandonment.create({
        userId: authResult?.userId,
        userEmail: email ? email.toLowerCase().trim() : undefined,
        sessionId: sessionId,
        items: items,
        subtotal: subtotal,
        total: total,
        lastActivityAt: new Date(),
        emailSent: false,
        recovered: false,
      });

      return NextResponse.json({ 
        success: true, 
        abandonmentId: abandonment._id,
        message: 'Cart abandonment tracked' 
      });
    }
  } catch (error) {
    console.error('Error tracking cart abandonment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/cart/abandonment - Get abandonment records (for admin or user)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const authResult = await verifyTokenOptional(request);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!authResult && !userEmail) {
      return NextResponse.json(
        { error: 'Authentication required or email parameter needed' },
        { status: 401 }
      );
    }

    const query: any = { recovered: false };
    if (authResult?.userId) {
      query.userId = authResult.userId;
    } else if (userEmail) {
      query.userEmail = userEmail.toLowerCase().trim();
    }

    const abandonments = await CartAbandonment.find(query)
      .sort({ lastActivityAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ abandonments });
  } catch (error) {
    console.error('Error fetching cart abandonments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

