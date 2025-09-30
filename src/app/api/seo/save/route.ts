import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SeoQuery, SeoKeyword, SeoProduct } from '@/models';

export async function POST(request: NextRequest) {
  console.log('[API] /api/seo/save POST start');
  try {
    await connectDB();
    const body = await request.json();
    const { query, keywords, products, metadata } = body || {};
    if (!query) {
      console.warn('[API] /api/seo/save missing query');
      return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
    }

    if (Array.isArray(keywords)) {
      for (const k of keywords) {
        await SeoKeyword.findOneAndUpdate(
          { query, keyword: k.keyword },
          {
            query,
            keyword: k.keyword,
            searchVolume: k.searchVolume,
            competition: k.competition,
            difficulty: k.difficulty,
            source: 'serpapi'
          },
          { upsert: true, new: true }
        );
      }
    }

    if (Array.isArray(products)) {
      for (const p of products) {
        await SeoProduct.findOneAndUpdate(
          { query, title: p.title, source: p.source || '' },
          {
            query,
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
    }

    await SeoQuery.create({ query, type: products?.length ? 'products' : 'keywords', resultsCount: (products?.length || keywords?.length || 0), metadata });

    console.log('[API] /api/seo/save success');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] /api/seo/save error', error);
    return NextResponse.json({ success: false, error: 'Failed to save SEO data' }, { status: 500 });
  }
}

