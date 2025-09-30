import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SeoQuery, SeoKeyword, SeoProduct } from '@/models';

// Returns unique recent searches (grouped by query+type), with small previews
export async function GET(request: NextRequest) {
  console.log('[API] /api/seo/history GET start');
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '12', 10), 50));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const type = searchParams.get('type') || 'all'; // 'all' | 'keywords' | 'products'
    const previewKeywords = Math.max(0, Math.min(parseInt(searchParams.get('kw') || '5', 10), 50));
    const previewProducts = Math.max(0, Math.min(parseInt(searchParams.get('pr') || '3', 10), 50));

    await connectDB();

    const match: any = {};
    if (type !== 'all') match.type = type;

    // Distinct recent searches by query+type (latest entry only)
    const groups = await SeoQuery.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { query: '$query', type: '$type' },
          query: { $first: '$query' },
          type: { $first: '$type' },
          createdAt: { $first: '$createdAt' },
          resultsCount: { $first: '$resultsCount' },
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit }
    ]);

    // Attach small previews without heavy payloads
    const history = await Promise.all(groups.map(async (g: any) => {
      const [kws, prods] = await Promise.all([
        previewKeywords > 0 ? SeoKeyword.find({ query: g.query }).sort({ createdAt: -1 }).limit(previewKeywords).lean() : [],
        previewProducts > 0 ? SeoProduct.find({ query: g.query }).sort({ createdAt: -1 }).limit(previewProducts).lean() : [],
      ]);
      return { ...g, keywords: kws, products: prods };
    }));

    console.log('[API] /api/seo/history success', { count: history.length });
    return NextResponse.json({ success: true, history, total: history.length });
  } catch (error) {
    console.error('[API] /api/seo/history error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch search history' }, { status: 500 });
  }
}
