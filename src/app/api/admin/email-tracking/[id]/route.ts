import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailTracking from '@/models/EmailTracking';
import jwt from 'jsonwebtoken';

async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role?: string };
  if (decoded.role !== 'admin' && decoded.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
  return decoded;
}

/**
 * Get detailed tracking information for a specific email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = await params;
    const tracking = await EmailTracking.findById(id)
      .populate('subscriberId', 'email firstName lastName visitCount converted')
      .lean();

    if (!tracking) {
      return NextResponse.json(
        { error: 'Email tracking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tracking);
  } catch (error) {
    console.error('Error fetching email tracking details:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

