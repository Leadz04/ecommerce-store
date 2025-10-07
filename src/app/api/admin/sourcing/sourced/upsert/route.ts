import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      categoryGroup,
      title,
      sourceUrl,
      price,
      description,
      images,
      specs,
    } = body || {};

    if (!sourceUrl || !categoryGroup) {
      return NextResponse.json({ error: 'Missing sourceUrl or categoryGroup' }, { status: 400 });
    }

    const Sourced = await getSourcedProductModel();
    const query = id ? { _id: id } : { categoryGroup, sourceUrl };
    const update = {
      categoryGroup,
      sourceUrl,
      title: title || 'Untitled',
      price: typeof price === 'number' ? price : undefined,
      description: description || '',
      images: Array.isArray(images) ? images.slice(0, 20) : [],
      specs: specs || {},
    } as any;

    const doc = await Sourced.findOneAndUpdate(query, update, { upsert: true, new: true });
    return NextResponse.json({ ok: true, item: doc });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to upsert sourced product' }, { status: 500 });
  }
}


