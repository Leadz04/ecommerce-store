import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const user = await User.findById(userId).select('settings');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Include attribution for client awareness (captured by middleware)
    const attribKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','aff'];
    const attribution: Record<string, string> = {};
    for (const key of attribKeys) {
      const headerKey = `x-attrib-${key}`;
      const headerVal = request.headers.get(headerKey) as string | null;
      if (headerVal) attribution[key] = headerVal;
    }

    return NextResponse.json({ settings: user.settings, attribution });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const userId = await verifyToken(request);
    const updates = await request.json();
    const allowed = ['emailNotifications', 'smsNotifications'];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) sanitized[key] = updates[key];
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: Object.keys(sanitized).reduce((acc, k) => ({ ...acc, [`settings.${k}`]: (sanitized as any)[k] }), {}) },
      { new: true }
    ).select('settings');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ settings: user.settings });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


