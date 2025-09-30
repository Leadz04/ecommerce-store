import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.SYSTEM_LOGS])(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const action = searchParams.get('action') || '';
    const resourceType = searchParams.get('resourceType') || '';
    const userId = searchParams.get('userId') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: any = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.userId = userId;
    if (from || to) {
      query.createdAt = {} as any;
      if (from) (query.createdAt as any).$gte = new Date(from);
      if (to) (query.createdAt as any).$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await AuditLog.countDocuments(query);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
