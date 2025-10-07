import { NextRequest, NextResponse } from 'next/server';
import { scrapeCategory } from '@/lib/categoryScraper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const maxPagesParam = searchParams.get('maxPages');

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const maxPages = maxPagesParam ? Math.max(1, Math.min(10, parseInt(maxPagesParam))) : 1;

    const { products, pagesVisited } = await scrapeCategory(url, { maxPages });

    return NextResponse.json({
      sourceUrl: url,
      pagesVisited,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('scrape-category error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to scrape category' }, { status: 500 });
  }
}


