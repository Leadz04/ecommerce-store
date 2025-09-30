import { NextRequest, NextResponse } from 'next/server';
import { SEOAPIs } from '@/lib/external-apis';
import connectDB from '@/lib/mongodb';
import { SeoQuery, SeoProduct } from '@/models';

export async function GET(request: NextRequest) {
  console.log('[API] /api/seo/products GET start');
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    if (!q.trim()) {
      console.warn('[API] /api/seo/products missing q');
      return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 });
    }

    await connectDB();

    const seo = new SEOAPIs();
    const products = await seo.searchProductsSerpAPI(q, Math.min(limit, 50));

    // save query
    await SeoQuery.create({ query: q, type: 'products', resultsCount: products.length });
    // upsert products
    for (const p of products) {
      await SeoProduct.findOneAndUpdate(
        { query: q, title: p.title, source: p.source || '' },
        {
          query: q,
          source: p.source || '',
          title: p.title,
          price: p.price,
          originalPrice: p.originalPrice,
          rating: p.rating,
          reviews: p.reviews,
          thumbnail: p.thumbnail,
          productId: p.productId,
          productApiUrl: p.productApiUrl
        },
        { upsert: true, new: true }
      );
    }

    console.log('[API] /api/seo/products success', { count: products.length });
    return NextResponse.json({ success: true, products, total: products.length });
  } catch (error) {
    console.error('[API] /api/seo/products error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

