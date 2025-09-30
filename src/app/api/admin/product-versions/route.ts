import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { ProductVersion } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.PRODUCT_VIEW])(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const action = searchParams.get('action') || '';
    const productId = searchParams.get('productId') || '';
    const externalId = searchParams.get('externalId') || '';
    const source = searchParams.get('source') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: any = {};
    if (action) query.action = action;
    if (productId) query.productId = productId;
    if (externalId) query.externalId = externalId;
    if (source) query.source = source;
    if (from || to) {
      query.fetchedAt = {} as any;
      if (from) (query.fetchedAt as any).$gte = new Date(from);
      if (to) (query.fetchedAt as any).$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const versions = await ProductVersion.find(query).sort({ fetchedAt: -1 }).skip(skip).limit(limit).lean();
    const total = await ProductVersion.countDocuments(query);

    return NextResponse.json({
      versions,
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
    console.error('Versions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
