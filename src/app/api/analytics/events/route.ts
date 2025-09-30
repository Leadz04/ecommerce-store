import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AnalyticsEvent } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { type, userId, sessionId, productId, orderId, value, currency, metadata } = body || {};
    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    const ev = await AnalyticsEvent.create({ type, userId, sessionId, productId, orderId, value, currency, metadata });
    return NextResponse.json({ ok: true, id: ev._id });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


