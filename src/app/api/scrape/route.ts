import { NextRequest, NextResponse } from 'next/server';
import { scrapeCategory } from '@/lib/categoryScraper';

const DEFAULT_COLLECTION_URL = 'https://outfitters.com.pk/collections/men-outerwear';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeTargetUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = sanitizeTargetUrl(searchParams.get('url')) ?? DEFAULT_COLLECTION_URL;

  try {
    const { products, pagesVisited } = await scrapeCategory(target, {
      delayMsBetweenPages: 200,
      maxPages: 50,
    });

    return NextResponse.json({
      source: target,
      total: products.length,
      pagesVisited,
      products,
    });
  } catch (error: any) {
    console.error('Scrape route error', error);
    const message = error?.message ?? 'Unexpected error during scrape';
    const statusCode = error?.response?.status ?? 500;
    return NextResponse.json(
      { error: 'Failed to scrape collection', detail: message },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  let payload: { url?: string; maxPages?: number; delayMsBetweenPages?: number } = {};
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = {
        url: formData.get('url')?.toString(),
        maxPages: formData.get('maxPages')
          ? Number.parseInt(formData.get('maxPages')!.toString(), 10)
          : undefined,
        delayMsBetweenPages: formData.get('delayMsBetweenPages')
          ? Number.parseInt(formData.get('delayMsBetweenPages')!.toString(), 10)
          : undefined,
      };
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const target = sanitizeTargetUrl(payload.url ?? null) ?? DEFAULT_COLLECTION_URL;
  const maxPages =
    typeof payload.maxPages === 'number' && Number.isFinite(payload.maxPages) && payload.maxPages > 0
      ? Math.min(payload.maxPages, 200)
      : 50;
  const delayMs =
    typeof payload.delayMsBetweenPages === 'number' &&
    Number.isFinite(payload.delayMsBetweenPages) &&
    payload.delayMsBetweenPages >= 0
      ? Math.min(payload.delayMsBetweenPages, 5000)
      : 200;

  try {
    const { products, pagesVisited } = await scrapeCategory(target, {
      delayMsBetweenPages: delayMs,
      maxPages,
    });

    return NextResponse.json({
      source: target,
      total: products.length,
      pagesVisited,
      products,
    });
  } catch (error: any) {
    console.error('Scrape route error', error);
    const message = error?.message ?? 'Unexpected error during scrape';
    const statusCode = error?.response?.status ?? 500;
    return NextResponse.json(
      { error: 'Failed to scrape collection', detail: message },
      { status: statusCode }
    );
  }
}


