import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SeoQuery, SeoProduct } from '@/models';
import { applyDeduplication } from '@/lib/deduplication';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search stored SerpAPI raw snapshots and related SeoProduct rows
// GET /api/seo/raw-search?q=leather%20jacket&limit=5
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept raw URLs and optional leading '@' prefix for quick-paste
    const qRaw = (searchParams.get('q') || '').trim();
    const q = qRaw.startsWith('@') ? qRaw.slice(1) : qRaw;
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '5', 10), 25));

    await connectDB();

    console.log('[API] /api/seo/raw-search start', { qPreview: q?.slice(0, 120), limit });

    // If a query term is provided, use case-insensitive regex for filtering
    const rx = q ? new RegExp(escapeRegex(q), 'i') : null;

    // URL-aware fuzzy matching: when q is a URL, match by domain and leading path prefix
    let isUrl = false;
    let hostRx: RegExp | null = null;
    let pathRx: RegExp | null = null;
    let looseStemRx: RegExp | null = null;
    try {
      const u = new URL(q);
      isUrl = true;
      const host = (u.hostname || '').replace(/^www\./, '');
      const pathname = (u.pathname || '/');
      const pathPrefix = pathname
        .split('/')
        .filter(Boolean)
        .slice(0, 3)
        .join('/');
      hostRx = host ? new RegExp(escapeRegex(host), 'i') : null;
      pathRx = pathPrefix ? new RegExp(escapeRegex(pathPrefix), 'i') : null;

      // Build a loose stem from the last path segment (e.g., "mens-racer-leather-jacket-black")
      // Use the first 2-3 tokens to allow variations (e.g., "mens-racer" matches "mens-racer-jacket-black-matte")
      const lastSeg = pathname.split('/').filter(Boolean).pop() || '';
      const tokens = lastSeg.split(/[^a-z0-9]+/i).filter(Boolean);
      if (tokens.length >= 2) {
        const stem = tokens.slice(0, Math.min(3, tokens.length)).join('[^-_/]*-');
        // Require at least the first token and loosely the second to appear in order
        looseStemRx = new RegExp(stem, 'i');
      }
    } catch {}

    // Pull recent product-type SeoQuery documents that contain rawResponse
    const recent = await SeoQuery.find({ type: 'products', rawResponse: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const results: any[] = [];

    for (const doc of recent) {
      const raw = (doc as any).rawResponse || {};
      const gs = raw?.engines?.google_shopping?.shopping_results || [];
      const gg = raw?.engines?.google?.immersive_products || [];
      const go = raw?.engines?.google?.organic_results || [];

      // Filter by regex if provided; otherwise pass through
      const filterItem = (it: any) => {
        if (!rx) return true;
        if (isUrl && (hostRx || pathRx || looseStemRx)) {
          const linkish = `${it?.link || ''} ${it?.product_link || ''} ${it?.serpapi_product_api || ''} ${it?.thumbnail || ''}`;
          const hostOk = hostRx ? hostRx.test(linkish) : true;
          const pathOk = pathRx ? pathRx.test(linkish) : true;
          const looseOk = looseStemRx ? (looseStemRx.test(linkish) || looseStemRx.test(it?.title || '')) : true;
          if (hostOk && (pathOk || looseOk)) return true;
        }
        return (
          rx.test(it?.title || '') ||
          rx.test(it?.source || it?.store || '') ||
          rx.test(it?.link || '') ||
          rx.test(it?.product_link || '') ||
          rx.test(it?.serpapi_product_api || '') ||
          rx.test(it?.thumbnail || '')
        );
      };

      const gsFiltered = gs.filter(filterItem).slice(0, 50);
      const ggFiltered = gg.filter(filterItem).slice(0, 50);
      const goFiltered = go.filter((it: any) => {
        if (!rx) return true;
        if (isUrl && (hostRx || pathRx || looseStemRx)) {
          const linkish = `${it?.link || ''} ${it?.displayed_link || ''}`;
          const hostOk = hostRx ? hostRx.test(linkish) : true;
          const pathOk = pathRx ? pathRx.test(linkish) : true;
          const looseOk = looseStemRx ? (looseStemRx.test(linkish) || looseStemRx.test(it?.title || '') || looseStemRx.test(it?.snippet || '')) : true;
          if (hostOk && (pathOk || looseOk)) return true;
        }
        // organic_results have different shape: title, link, snippet, displayed_link
        return (
          rx.test(it?.title || '') ||
          rx.test(it?.link || '') ||
          rx.test(it?.snippet || '') ||
          rx.test(it?.displayed_link || '')
        );
      }).slice(0, 50);

      // Also fetch SeoProduct rows tied to this query and optionally filtered by title/link
      let productsDbRaw: any[] = [];
      if (q) {
        productsDbRaw = await SeoProduct.find({
          query: doc.query,
          $or: (
            isUrl && (hostRx || pathRx)
              ? [
                  hostRx ? { link: { $regex: hostRx } } : null,
                  hostRx ? { productApiUrl: { $regex: hostRx } } : null,
                  pathRx ? { link: { $regex: pathRx } } : null,
                  pathRx ? { productApiUrl: { $regex: pathRx } } : null,
                ].filter(Boolean) as any
              : [
                  { title: { $regex: rx } },
                  { link: { $regex: rx } },
                  { productApiUrl: { $regex: rx } },
                  { source: { $regex: rx } }
                ]
          )
        }).limit(50).lean();
      } else {
        productsDbRaw = await SeoProduct.find({ query: doc.query }).limit(25).lean();
      }

      // Apply deduplication to ensure unique products
      const productsDb = applyDeduplication(productsDbRaw, 'seoProducts');

      const googleCombinedCount = ggFiltered.length + goFiltered.length;
      const hasAny = (gsFiltered.length + googleCombinedCount + productsDb.length) > 0 || !rx;
      if (hasAny) {
        results.push({
          query: doc.query,
          createdAt: doc.createdAt,
          rawResponse: {
            engines: {
              google_shopping: raw?.engines?.google_shopping || null,
              google: raw?.engines?.google || null
            }
          },
          matches: {
            shoppingCount: gsFiltered.length,
            googleCount: googleCombinedCount,
            dbCount: productsDb.length
          },
          // Include filtered products from raw response with correct links
          rawProducts: {
            googleShopping: gsFiltered.map((p: any) => ({
              title: p.title,
              source: p.source || p.store,
              price: p.extracted_price,
              originalPrice: p.extracted_original_price,
              rating: p.rating,
              reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
              thumbnail: p.thumbnail,
              productId: p.product_id,
              // Use the actual product website link, not SerpAPI link
              link: p.link, // This contains the real product website URL
              productApiUrl: p.serpapi_product_api, // This is the SerpAPI URL
              sourceType: 'google_shopping'
            })),
            googleImmersive: ggFiltered.map((p: any) => ({
              title: p.title,
              source: p.source,
              price: p.extracted_price,
              originalPrice: p.extracted_original_price,
              rating: p.rating,
              reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
              thumbnail: p.thumbnail,
              productId: p.product_id,
              link: p.link,
              productApiUrl: p.serpapi_product_api,
              sourceType: 'google_immersive'
            })),
            googleOrganic: goFiltered.map((p: any) => ({
              title: p.title,
              source: p.source || 'Google',
              price: undefined,
              originalPrice: undefined,
              rating: undefined,
              reviews: undefined,
              thumbnail: undefined,
              productId: undefined,
              link: p.link, // This contains the real website URL
              productApiUrl: undefined,
              sourceType: 'google_organic'
            }))
          },
          // Deduplicated products from all sources
          allProducts: (() => {
            // Combine all products from different sources
            const allProducts = [
              ...gsFiltered.map((p: any) => ({
                title: p.title,
                source: p.source || p.store,
                price: p.extracted_price,
                originalPrice: p.extracted_original_price,
                rating: p.rating,
                reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
                thumbnail: p.thumbnail,
                productId: p.product_id,
                link: p.link,
                productApiUrl: p.serpapi_product_api,
                sourceType: 'google_shopping'
              })),
              ...ggFiltered.map((p: any) => ({
                title: p.title,
                source: p.source,
                price: p.extracted_price,
                originalPrice: p.extracted_original_price,
                rating: p.rating,
                reviews: typeof p.reviews === 'string' ? parseInt(p.reviews.replace(/\D/g, '')) : p.reviews,
                thumbnail: p.thumbnail,
                productId: p.product_id,
                link: p.link,
                productApiUrl: p.serpapi_product_api,
                sourceType: 'google_immersive'
              })),
              ...goFiltered.map((p: any) => ({
                title: p.title,
                source: p.source || 'Google',
                price: undefined,
                originalPrice: undefined,
                rating: undefined,
                reviews: undefined,
                thumbnail: undefined,
                productId: undefined,
                link: p.link,
                productApiUrl: undefined,
                sourceType: 'google_organic'
              })),
              ...productsDb.map((p: any) => ({
                title: p.title,
                source: p.source,
                price: p.price,
                originalPrice: p.originalPrice,
                rating: p.rating,
                reviews: p.reviews,
                thumbnail: p.thumbnail,
                productId: p.productId,
                link: p.link,
                productApiUrl: p.productApiUrl,
                sourceType: 'database'
              }))
            ];

            // Deduplicate based on title + source combination
            const seen = new Map();
            const uniqueProducts = [];

            for (const product of allProducts) {
              const key = `${product.title.toLowerCase().trim()}_${(product.source || '').toLowerCase().trim()}`;
              if (!seen.has(key)) {
                seen.set(key, true);
                uniqueProducts.push(product);
              }
            }

            return uniqueProducts;
          })(),
          productsDb
        });

        console.log('[API] /api/seo/raw-search match', {
          query: doc.query,
          shoppingCount: gsFiltered.length,
          googleCount: googleCombinedCount,
          dbCount: productsDb.length
        });
      }

      if (results.length >= limit) break;
    }

    // Apply deduplication to final results to ensure unique entries
    const uniqueResults = applyDeduplication(results, 'seoQueries');

    console.log('[API] /api/seo/raw-search done', { total: uniqueResults.length });
    return NextResponse.json({ success: true, total: uniqueResults.length, items: uniqueResults });
  } catch (error) {
    console.error('[API] /api/seo/raw-search error', error);
    return NextResponse.json({ success: false, error: 'Failed to search raw snapshots' }, { status: 500 });
  }
}


