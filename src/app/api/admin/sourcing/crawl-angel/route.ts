import { NextRequest, NextResponse } from 'next/server';
import { crawlAngelJacketsCollections } from '@/lib/angelJackets';
import { fetchAndParseProduct } from '@/lib/productParser';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, url, maxPagesPerCategory, save = false } = body || {};
    if (!html && !url) {
      return NextResponse.json({ error: 'Provide html or url' }, { status: 400 });
    }

    const result = await crawlAngelJacketsCollections({ html, url, maxPagesPerCategory: Math.max(1, Math.min(100, parseInt(String(maxPagesPerCategory || 1)))) });
    try {
      const groups = Object.values(result.results || {});
      const Sourced = save ? await getSourcedProductModel() : null;
      for (const g of groups) {
        for (const p of (g.products || [])) {
          if (p?.url) console.log('[product-url]', p.url);
          if (save && Sourced && p?.url) {
            try {
              const parsed = await fetchAndParseProduct(p.url);
              const normalizedTitle = (parsed.title || '').trim().replace(/\s+/g, ' ');
              const categoryGroup = `${g.label}:${g.url}`;
              await Sourced.updateOne(
                { categoryGroup, title: normalizedTitle },
                {
                  title: normalizedTitle || 'Untitled',
                  sourceUrl: parsed.sourceUrl,
                  categoryGroup,
                  price: parsed.price,
                  description: parsed.description,
                  images: parsed.images?.slice(0, 10) || [],
                  specs: parsed.specs || {},
                },
                { upsert: true }
              );
            } catch {}
          }
        }
      }
    } catch {}
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('crawl-angel error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to crawl Angel Jackets' }, { status: 500 });
  }
}


