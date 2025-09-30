import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SeoKeyword, SeoProduct } from '@/models';

// Returns stored keywords/products for a given query from DB only (no SerpAPI)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    if (!query) {
      return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
    }

    const kwLimit = Math.max(0, Math.min(parseInt(searchParams.get('kwLimit') || '100', 10), 500));
    const kwOffset = Math.max(0, parseInt(searchParams.get('kwOffset') || '0', 10));
    const prLimit = Math.max(0, Math.min(parseInt(searchParams.get('prLimit') || '50', 10), 200));
    const prOffset = Math.max(0, parseInt(searchParams.get('prOffset') || '0', 10));

    await connectDB();

    const [kwTotal, prTotal] = await Promise.all([
      SeoKeyword.countDocuments({ query }),
      SeoProduct.countDocuments({ query }),
    ]);

    const [keywords, products] = await Promise.all([
      kwLimit > 0 ? SeoKeyword.find({ query }).sort({ createdAt: -1 }).skip(kwOffset).limit(kwLimit).lean() : [],
      prLimit > 0 ? SeoProduct.find({ query }).sort({ createdAt: -1 }).skip(prOffset).limit(prLimit).lean() : [],
    ]);

    return NextResponse.json({
      success: true,
      query,
      keywords: { total: kwTotal, items: keywords },
      products: { total: prTotal, items: products },
    });
  } catch (error) {
    console.error('[API] /api/seo/history/details error', error);
    return NextResponse.json({ success: false, error: 'Failed to load stored results' }, { status: 500 });
  }
}


