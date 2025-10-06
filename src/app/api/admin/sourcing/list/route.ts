import { NextRequest, NextResponse } from 'next/server';
import { getScrapedModels } from '@/models/Scraped';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const { ScrapedProduct } = await getScrapedModels();
    const query: any = {};
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { sourceUrl: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      ScrapedProduct.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ScrapedProduct.countDocuments(query),
    ]);

    return NextResponse.json({ items, total, skip, limit });
  } catch (error) {
    console.error('Sourcing list error:', error);
    return NextResponse.json({ error: 'Failed to list scraped products' }, { status: 500 });
  }
}


