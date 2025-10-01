import { NextRequest, NextResponse } from 'next/server';
import { SEOAPIs } from '@/lib/external-apis';
import axios from 'axios';
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
    const max = Math.min(limit, 50);
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === 'demo') {
      console.warn('[API] /api/seo/products missing SERPAPI_KEY');
    }

    // Call both engines in parallel
    const [shoppingRes, googleRes] = await Promise.all([
      axios.get('https://serpapi.com/search', {
        params: { engine: 'google_shopping', q: q, num: max, api_key: apiKey }
      }).catch((e) => ({ data: null } as any)),
      axios.get('https://serpapi.com/search', {
        params: { engine: 'google', q: q, num: max, api_key: apiKey }
      }).catch((e) => ({ data: null } as any))
    ]);

    const shopping = shoppingRes?.data?.shopping_results || [];
    const immersive = googleRes?.data?.immersive_products || [];

    let products = [
      ...shopping.map((p: any) => ({
        title: p.title,
        source: p.source || p.store,
        price: p.extracted_price,
        originalPrice: p.extracted_original_price,
        rating: p.rating,
        reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
        thumbnail: p.thumbnail,
        productId: p.product_id,
        productApiUrl: p.serpapi_product_api,
        link: p.link
      }))
    ];

    const existingKeys = new Set(products.map(p => `${p.title}__${p.source || ''}`));
    for (const p of immersive.map((p: any) => ({
      title: p.title,
      source: p.source,
      price: p.extracted_price,
      originalPrice: p.extracted_original_price,
      rating: p.rating,
      reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
      thumbnail: p.thumbnail,
      productId: p.product_id,
      productApiUrl: p.serpapi_product_api,
      link: undefined
    }))) {
      const key = `${p.title}__${p.source || ''}`;
      if (!existingKeys.has(key)) {
        products.push(p);
        existingKeys.add(key);
      }
      if (products.length >= max) break;
    }

    // save query with raw response snapshot
    const rawResponse = {
      provider: 'serpapi',
      query: q,
      timestamp: Date.now(),
      engines: {
        google_shopping: shoppingRes?.data || null,
        google: googleRes?.data || null
      }
    } as const;
    await SeoQuery.create({ query: q, type: 'products', resultsCount: products.length, rawResponse });
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
          productApiUrl: p.productApiUrl,
          link: (p as any).product_link || p.link
        },
        { upsert: true, new: true }
      );
    }

    console.log('[API] /api/seo/products success', { count: products.length });
    return NextResponse.json({ success: true, products, total: products.length, rawResponse });
  } catch (error) {
    console.error('[API] /api/seo/products error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

