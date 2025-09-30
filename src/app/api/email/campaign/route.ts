import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { querySegment, type SegmentFilter } from '@/lib/segments';
import jwt from 'jsonwebtoken';

async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role?: string };
  return decoded;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (!auth || (auth as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subject, html, text, segment }: { subject: string; html: string; text?: string; segment: SegmentFilter } = await request.json();
    if (!subject || !html) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const users = await querySegment(segment || {});
    const emails = users.map((u: any) => u.email).filter(Boolean);

    let sent = 0;
    for (const email of emails) {
      const ok = await sendEmail({ to: email, subject, html, text });
      if (ok) sent++;
    }

    return NextResponse.json({ recipients: emails.length, sent });
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


