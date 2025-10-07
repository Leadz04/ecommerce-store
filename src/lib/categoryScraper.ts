import axios from 'axios';
import * as cheerio from 'cheerio';

export type ScrapedProduct = {
  title: string;
  price: string | null;
  image: string | null;
  url: string;
};

export type ScrapeCategoryOptions = {
  maxPages?: number;
  delayMsBetweenPages?: number;
};

function absoluteUrl(base: string, href: string | undefined): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape a category/listing page for angeljackets-like structure.
 * Tries a few common selectors and falls back defensively.
 */
export async function scrapeCategory(
  categoryUrl: string,
  options: ScrapeCategoryOptions = {}
): Promise<{ products: ScrapedProduct[]; pagesVisited: string[] }> {
  // Default to crawling until no next page, with a hard cap to avoid infinite loops
  const maxPages = options.maxPages ?? 100;
  const delayMs = options.delayMsBetweenPages ?? 600;

  const visited: string[] = [];
  const products: ScrapedProduct[] = [];

  let nextUrl: string | null = categoryUrl;
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    visited.push(nextUrl);
    const htmlResp = await axios.get(nextUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 20000,
    });

    const $ = cheerio.load(htmlResp.data as string);

    // Product card selectors (common patterns)
    const productNodes =
      $('.product, .product-item, .product-grid-item, li.product, .grid__item').toArray();

    // If nothing matched, try more specific AngelJackets patterns or anchors linking to products
    let nodes = productNodes.length ? productNodes : $('div.collection-listing .product').toArray();

    let pageProductCount = 0;

    if (!nodes.length) {
      // Fallback: collect anchors that look like product links (broadened)
      const anchors = $('a[href*="/products"], [data-href*="/products"]').toArray();
      const seen = new Set<string>();
      for (const a of anchors) {
        const $a = $(a);
        const rawHref = $a.attr('href') || $a.attr('data-href');
        const hrefAbs = absoluteUrl(nextUrl, rawHref);
        if (!hrefAbs || seen.has(hrefAbs)) continue;
        seen.add(hrefAbs);

        // Try to infer a product card context from the anchor
        const card = $a.closest('.product, .product-item, .product-grid-item, .grid__item, .productgrid--item, .card, .product-card, li, article').first();
        const ctx = card && card.length ? card : $a.parent();

        const title =
          (ctx.find('.product-title, .title, h2 a, h3 a, a.product-title').first().text().trim()) ||
          ($a.attr('title')?.trim() || $a.text().trim());

        const imgEl = (ctx.find('img').first().length ? ctx.find('img').first() : $a.find('img').first());
        const image = absoluteUrl(nextUrl, imgEl.attr('data-src') || imgEl.attr('src'));

        // Look for a nearby price element
        let priceText =
          ctx.find('.price, .product-price, .price__current, .money, .card-price, .price-section, [itemprop="price"]').first().text().trim() ||
          ctx.find('[data-product-price], [data-price]').first().text().trim() ||
          '';
        if (!priceText) {
          // Expand search slightly around the anchor
          const parentText = ($a.closest('li, article, .grid__item, .product-item').text() || '').trim();
          const match = parentText.match(/\$\s?\d+[\d,]*(?:\.\d{2})?/);
          priceText = match ? match[0] : '';
        }

        if (hrefAbs && title) {
          products.push({
            title,
            price: priceText || null,
            image: image || null,
            url: hrefAbs,
          });
          pageProductCount++;
        }
      }

      // If still nothing, try heading+price heuristic blocks
      if (pageProductCount === 0) {
        $('h2, h3, h4').each((_, h) => {
          const $h = $(h);
          const hTitle = $h.text().trim();
          if (!hTitle || hTitle.length < 5) return;
          const a = $h.find('a').first();
          const hrefAbs = absoluteUrl(nextUrl, a.attr('href'));
          // Nearby price in siblings or parent
          const container = $h.closest('li, article, .grid__item, .product, .product-item, .card').first().length ? $h.closest('li, article, .grid__item, .product, .product-item, .card').first() : $h.parent();
          const priceText = container.find('.price, .product-price, .money').first().text().trim() || '';
          const imgEl = container.find('img').first();
          const image = absoluteUrl(nextUrl, imgEl.attr('data-src') || imgEl.attr('src'));
          if (hrefAbs) {
            products.push({ title: hTitle, price: priceText || null, image: image || null, url: hrefAbs });
            pageProductCount++;
          }
        });
      }
    } else {
      for (const node of nodes) {
        const el = $(node);

        // Link and title
        const anchor = el.find('a').first();
        const href = absoluteUrl(nextUrl, anchor.attr('href'));
        const title =
          el.find('.product-title, .title, h2 a, h3 a, a.product-title').first().text().trim() ||
          anchor.attr('title')?.trim() ||
          anchor.text().trim();

        // Image
        const imgEl = el.find('img').first();
        const image = absoluteUrl(nextUrl, imgEl.attr('data-src') || imgEl.attr('src'));

        // Price
        const priceText =
          el.find('.price, .product-price, .price__current, .money, [itemprop="price"]').first().text().trim() ||
          el.find('[data-product-price], [data-price]').first().text().trim() ||
          null;

        if (href && title) {
          products.push({
            title,
            price: priceText && priceText.length > 0 ? priceText : null,
            image: image || null,
            url: href,
          });
          pageProductCount++;
        }
      }
    }

    // Find pagination next link (broadened)
    let nextHref: string | null =
      absoluteUrl(nextUrl, $('a[rel="next"]').attr('href')) ||
      absoluteUrl(nextUrl, $('link[rel="next"]').attr('href')) ||
      absoluteUrl(nextUrl, $('.pagination .next a, .Pager .next a, a[aria-label="Next"], a[title="Next"], .next a, .PageNext a').attr('href')) ||
      // Look for active page then pick the following sibling
      ((): string | null => {
        const active = $('.pagination li.active a, .pagination .is-active a').first();
        if (active && active.length) {
          const li = active.closest('li');
          const nextA = li.next().find('a').first();
          if (nextA && nextA.attr('href')) return absoluteUrl(nextUrl!, nextA.attr('href'));
        }
        return null;
      })() ||
      // Fallback: look for any anchor that increments ?page=
      ((): string | null => {
        try {
          const urlObj = new URL(nextUrl!);
          const currentPage = parseInt(urlObj.searchParams.get('page') || '1');
          const candidate = $(`a[href*="page=${currentPage + 1}"]`).first().attr('href');
          return absoluteUrl(nextUrl!, candidate);
        } catch {
          return null;
        }
      })();

    pageCount += 1;
    // Silence internal logs; API will report discovered product URLs
    if (!nextHref || pageCount >= maxPages) {
      nextUrl = null;
    } else {
      nextUrl = nextHref;
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  return { products, pagesVisited: visited };
}


