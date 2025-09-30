import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SearchEvent } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, sessionId, query, resultsCount } = body || {};
    if (typeof query !== 'string' || typeof resultsCount !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    await SearchEvent.create({ userId, sessionId, query, resultsCount });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


