import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;
    const categoryGroup = (searchParams.get('categoryGroup') || '').trim();
    const sourceUrl = (searchParams.get('sourceUrl') || '').trim();

    const Sourced = await getSourcedProductModel();
    const query: any = {};
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { sourceUrl: { $regex: q, $options: 'i' } },
      ];
    }
    if (categoryGroup) query.categoryGroup = categoryGroup;
    if (sourceUrl) query.sourceUrl = sourceUrl;

    const [items, total] = await Promise.all([
      Sourced.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Sourced.countDocuments(query),
    ]);

    return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to list sourced products' }, { status: 500 });
  }
}


