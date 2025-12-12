import { NextRequest, NextResponse } from 'next/server';
import { crawlAngelJacketsCollections } from '@/lib/angelJackets';
import { fetchAndParseProduct } from '@/lib/productParser';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

/**
 * Normalize title for duplicate detection
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove special characters (keep alphanumeric and spaces)
 * - Trim
 */
function normalizeTitleForDedup(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, ' ') // Clean up any remaining multiple spaces
    .trim();
}

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
      let savedCount = 0;
      let skippedCount = 0;
      for (const g of groups) {
        for (const p of (g.products || [])) {
          if (p?.url) console.log('[product-url]', p.url);
          if (save && Sourced && p?.url) {
            try {
              const parsed = await fetchAndParseProduct(p.url);
              const normalizedTitle = (parsed.title || '').trim().replace(/\s+/g, ' ');
              const normalizedTitleForDedup = normalizeTitleForDedup(normalizedTitle);
              const categoryGroup = `${g.label}:${g.url}`;
              
              // Check for duplicate by normalized title
              const allExisting = await Sourced.find({ categoryGroup }).select('title').lean();
              const isDuplicate = allExisting.some(existing => {
                const existingNormalized = normalizeTitleForDedup(existing.title || '');
                return existingNormalized === normalizedTitleForDedup && existingNormalized.length > 0;
              });
              
              if (isDuplicate) {
                console.log(`Skipping duplicate product: "${normalizedTitle}" (already exists)`);
                skippedCount++;
                continue;
              }
              
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
              savedCount++;
            } catch (err: any) {
              // Check if error is due to duplicate key (unique index violation)
              if (err.code === 11000 || err.message?.includes('duplicate')) {
                console.log(`Skipping duplicate product: "${p.url}" (unique index violation)`);
                skippedCount++;
              } else {
                console.error(`Error saving product ${p.url}:`, err.message);
              }
            }
          }
        }
      }
      if (save && Sourced) {
        console.log(`Saved ${savedCount} products, skipped ${skippedCount} duplicates`);
      }
    } catch {}
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('crawl-angel error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to crawl Angel Jackets' }, { status: 500 });
  }
}


