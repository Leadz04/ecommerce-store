import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load as loadHtml } from 'cheerio';
import { fetchAndParseProduct } from '@/lib/productParser';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

type ScrapedProduct = {
  title: string;
  price: string | null;
  image: string | null;
  url: string;
  // Full details (when fetched)
  images?: string[];
  description?: string;
  specifications?: Record<string, string>;
  priceNumber?: number;
  brand?: string;
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

function normalizeBrandName(raw: string | undefined | null, fallback: string): string {
  const candidate = (raw ?? '').trim();
  if (!candidate) return fallback;
  return candidate
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function deriveCollectionSlug(url: string | undefined): string {
  if (!url) return 'collection';
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const collectionsIdx = segments.indexOf('collections');
    if (collectionsIdx >= 0) {
      const afterCollections = segments.slice(collectionsIdx + 1);
      if (afterCollections.length > 0) {
        return afterCollections.join('-').toLowerCase();
      }
    }
    if (segments.length > 0) {
      return segments.join('-').toLowerCase();
    }
    return 'collection';
  } catch {
    return String(url)
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'collection';
  }
}

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

/**
 * Scrape Outfitters collections page
 * Handles both static HTML and Shopify API endpoints for "load more" functionality
 */
async function scrapeOutfittersCollection(
  collectionUrl: string,
  options: { maxPages?: number; delayMs?: number } = {}
): Promise<{ products: ScrapedProduct[]; pagesVisited: string[] }> {
  const maxPages = options.maxPages ?? 10;
  const delayMs = options.delayMs ?? 1000;

  const visited: string[] = [];
  const products: ScrapedProduct[] = [];
  const seenUrls = new Set<string>();

  // Try to detect if it's a Shopify store and look for API endpoints
  let baseUrl: string;
  try {
    const urlObj = new URL(collectionUrl);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    baseUrl = collectionUrl;
  }

  // First, fetch the initial page
  let currentUrl = collectionUrl;
  let pageCount = 0;

  while (currentUrl && pageCount < maxPages) {
    visited.push(currentUrl);
    pageCount++;

    try {
      const htmlResp = await axios.get(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 30000,
      });

      const $ = loadHtml(htmlResp.data as string);

      // Check for Shopify API endpoints in the HTML (common pattern)
      // Try to construct the products.json URL directly
      const collectionMatch = collectionUrl.match(/\/collections\/([^\/\?]+)/);
      if (collectionMatch && pageCount === 1) {
        const collectionHandle = collectionMatch[1];
        const apiUrl = `${baseUrl}/collections/${collectionHandle}/products.json`;
        
        try {
          let pageNum = 1;
          let hasMore = true;

          while (hasMore && pageNum <= maxPages) {
            const apiResp = await axios.get(`${apiUrl}?page=${pageNum}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
              },
              timeout: 30000,
            });

            const data = apiResp.data;
            if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
              for (const product of data.products) {
                const productUrl = absoluteUrl(baseUrl, `/products/${product.handle || product.id}`);
                if (!productUrl || seenUrls.has(productUrl)) continue;
                seenUrls.add(productUrl);

                const imageUrl = product.images?.[0]?.src || product.featured_image || null;
                const priceText = product.variants?.[0]?.price 
                  ? `Rs. ${(parseFloat(product.variants[0].price) / 100).toFixed(2)}`
                  : null;

                products.push({
                  title: product.title || 'Untitled',
                  price: priceText,
                  image: imageUrl ? absoluteUrl(baseUrl, imageUrl) : null,
                  url: productUrl,
                });
              }

              // Check if there are more pages
              hasMore = data.products.length >= 50; // Typical Shopify pagination size
              pageNum++;
              if (delayMs > 0) await sleep(delayMs);
            } else {
              hasMore = false;
            }
          }

          // If we successfully scraped via API, return early
          if (products.length > 0) {
            return { products, pagesVisited: visited };
          }
        } catch (apiError: any) {
          console.log('API scraping failed, falling back to HTML:', apiError.message);
        }
      }

      // Fallback to HTML parsing
      // Outfitters specific selectors
      const productSelectors = [
        '.product-item',
        '.product-card',
        '.grid-item',
        '.collection-product',
        'article.product',
        '.product-tile',
        '[data-product-id]',
        '.product-grid-item',
        '.product-block',
        '.product-info',
      ];

      let productNodes: any[] = [];
      for (const selector of productSelectors) {
        productNodes = $(selector).toArray();
        if (productNodes.length > 0) break;
      }

      // If no specific product containers found, look for product links
      if (productNodes.length === 0) {
        const productLinks = $('a[href*="/products/"], a[href*="/product/"]').toArray();
        const seen = new Set<string>();

        for (const link of productLinks) {
          const $link = $(link);
          const href = absoluteUrl(currentUrl, $link.attr('href'));
          if (!href || seen.has(href)) continue;
          seen.add(href);

          // Try to find product info in the link's context
          const card = $link.closest('.product, .product-item, .card, article, li, .grid-item').first();
          const ctx = card.length ? card : $link.parent();

          const title = ctx.find('h2, h3, .product-title, .title, [data-product-title], .product-name').first().text().trim() ||
                       $link.attr('title')?.trim() ||
                       $link.text().trim();

          const imgEl = ctx.find('img').first();
          const image = absoluteUrl(currentUrl, imgEl.attr('data-src') || imgEl.attr('src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-original'));

          const priceText = ctx.find('.price, .product-price, .money, [data-price], .price-current, .regular-price').first().text().trim() || null;

          if (href && title && !seenUrls.has(href)) {
            seenUrls.add(href);
            products.push({
              title,
              price: priceText,
              image,
              url: href,
            });
          }
        }
      } else {
        // Parse product nodes
        for (const node of productNodes) {
          const $el = $(node);

          // Find product link
          const link = $el.find('a').first();
          const href = absoluteUrl(currentUrl, link.attr('href'));
          if (!href || seenUrls.has(href)) continue;
          seenUrls.add(href);

          // Extract title
          const title = $el.find('.product-title, .title, h2, h3, [data-product-title], .product-name').first().text().trim() ||
                       link.attr('title')?.trim() ||
                       link.text().trim();

          // Extract image
          const imgEl = $el.find('img').first();
          const image = absoluteUrl(currentUrl, 
            imgEl.attr('data-src') || 
            imgEl.attr('src') || 
            imgEl.attr('data-lazy-src') ||
            imgEl.attr('data-original')
          );

          // Extract price
          const priceText = $el.find('.price, .product-price, .money, [data-price], .price-current, .regular-price').first().text().trim() || null;

          if (href && title) {
            products.push({
              title,
              price: priceText,
              image,
              url: href,
            });
          }
        }
      }

      // Look for "Load More" button or pagination
      let nextUrl: string | null = null;

      // Check for "Load More" or "Show More" button
      const loadMoreBtn = $('[data-load-more], .load-more, .btn-load-more, button:contains("Load More"), button:contains("Show More"), a:contains("Show More")').first();
      if (loadMoreBtn.length) {
        const dataUrl = loadMoreBtn.attr('data-url') || loadMoreBtn.attr('data-href') || loadMoreBtn.attr('href');
        const onClick = loadMoreBtn.attr('onclick');
        
        if (dataUrl) {
          nextUrl = absoluteUrl(currentUrl, dataUrl);
        } else if (onClick) {
          // Try to extract URL from onclick handler
          const urlMatch = onClick.match(/['"]([^'"]+)['"]/);
          if (urlMatch) {
            nextUrl = absoluteUrl(currentUrl, urlMatch[1]);
          }
        }
      }

      // Check for pagination links
      if (!nextUrl) {
        nextUrl = absoluteUrl(currentUrl, $('a[rel="next"]').attr('href')) ||
                 absoluteUrl(currentUrl, $('.pagination .next a').attr('href')) ||
                 absoluteUrl(currentUrl, $('a:contains("Next")').attr('href'));
      }

      // Check for page number increment
      if (!nextUrl) {
        try {
          const urlObj = new URL(currentUrl);
          const currentPage = parseInt(urlObj.searchParams.get('page') || '1');
          const nextPageUrl = new URL(currentUrl);
          nextPageUrl.searchParams.set('page', String(currentPage + 1));
          // Verify the next page exists by checking if there's a link to it
          const nextPageLink = $(`a[href*="page=${currentPage + 1}"], a[href*="page=${currentPage + 1}"]`).first();
          if (nextPageLink.length) {
            nextUrl = nextPageUrl.toString();
          }
        } catch {}
      }

      // If no next URL found, stop
      if (!nextUrl) {
        break;
      }

      currentUrl = nextUrl;
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    } catch (error: any) {
      console.error(`Error scraping page ${currentUrl}:`, error.message);
      break;
    }
  }

  return { products, pagesVisited: visited };
}

/**
 * Extract brand name from product page HTML
 */
function extractBrandFromHtml(html: string, url: string): string | null {
  try {
    const $ = loadHtml(html);
    
    // Try various selectors for brand
    const brandSelectors = [
      'meta[property="product:brand"]',
      'meta[itemprop="brand"]',
      '[data-brand]',
      '.brand',
      '.product-brand',
      '.vendor',
      '.product-vendor',
    ];
    
    for (const selector of brandSelectors) {
      const brand = $(selector).first().attr('content') || 
                   $(selector).first().attr('data-brand') ||
                   $(selector).first().text().trim();
      if (brand && brand.length > 0 && brand.length < 100) {
        return brand;
      }
    }
    
    // Try to extract from URL or page title
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      // Extract brand from common patterns
      if (hostname.includes('outfitters')) return 'Outfitters';
    } catch {}
    
    return null;
  } catch {
    return null;
  }
}

async function enrichProductsWithDetails(
  products: ScrapedProduct[],
  options: { delayMs?: number; maxConcurrent?: number; defaultBrand?: string } = {}
): Promise<ScrapedProduct[]> {
  const delayMs = options.delayMs ?? 500;
  const maxConcurrent = options.maxConcurrent ?? 5;
  const defaultBrand = options.defaultBrand || 'Outfitters';
  const enriched: ScrapedProduct[] = [];

  // Process products in batches to avoid overwhelming the server
  for (let i = 0; i < products.length; i += maxConcurrent) {
    const batch = products.slice(i, i + maxConcurrent);
    const promises = batch.map(async (product) => {
      try {
        console.log(`Fetching details for: ${product.url}`);
        const parsed = await fetchAndParseProduct(product.url);
        
        // Try to extract brand from the HTML
        let brand = defaultBrand;
        try {
          const htmlResp = await axios.get(product.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 15000,
          });
          const extractedBrand = extractBrandFromHtml(htmlResp.data as string, product.url);
          if (extractedBrand) {
            brand = normalizeBrandName(extractedBrand, defaultBrand);
          }
        } catch {}
        
        return {
          ...product,
          title: parsed.title || product.title,
          price: parsed.price ? `Rs. ${parsed.price.toLocaleString()}` : product.price,
          priceNumber: parsed.price,
          images: parsed.images && parsed.images.length > 0 ? parsed.images : (product.image ? [product.image] : []),
          image: parsed.images && parsed.images.length > 0 ? parsed.images[0] : product.image,
          description: parsed.description || '',
          specifications: parsed.specs || {},
          brand: normalizeBrandName(brand, defaultBrand),
        };
      } catch (error: any) {
        console.error(`Error fetching details for ${product.url}:`, error.message);
        // Return product with basic info if detail fetch fails
        return {
          ...product,
          images: product.image ? [product.image] : [],
          brand: normalizeBrandName(defaultBrand, defaultBrand),
        };
      }
    });

    const batchResults = await Promise.all(promises);
    enriched.push(...batchResults);

    // Delay between batches to be respectful to the server
    if (i + maxConcurrent < products.length && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return enriched;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, html, maxPages = 10, fetchDetails = true, save = false, brand = 'Outfitters' } = body || {};

    if (!url && !html) {
      return NextResponse.json({ error: 'Provide url or html' }, { status: 400 });
    }

    let collectionUrl = url || '';
    
    // If HTML is provided, try to extract the base URL from it
    if (html && !url) {
      const $ = loadHtml(html);
      const baseTag = $('base').attr('href');
      const ogUrl = $('meta[property="og:url"]').attr('content');
      if (ogUrl) {
        collectionUrl = ogUrl;
      } else if (baseTag) {
        collectionUrl = baseTag;
      } else {
        return NextResponse.json({ error: 'Cannot determine collection URL from HTML. Please provide URL.' }, { status: 400 });
      }
    }

    if (!collectionUrl) {
      return NextResponse.json({ error: 'Collection URL is required' }, { status: 400 });
    }

    // Ensure it's a collections URL
    if (!collectionUrl.includes('/collections')) {
      return NextResponse.json({ error: 'URL must be a collections page (e.g., https://outfitters.com.pk/collections/...)' }, { status: 400 });
    }

    // Step 1: Scrape collection page to get product URLs
    const { products, pagesVisited } = await scrapeOutfittersCollection(collectionUrl, {
      maxPages: Math.max(1, Math.min(50, parseInt(String(maxPages)))),
      delayMs: 1000,
    });

    // Step 2: Fetch full details for each product (if requested)
    let enrichedProducts = products;
    if (fetchDetails && products.length > 0) {
      console.log(`Fetching full details for ${products.length} products...`);
      enrichedProducts = await enrichProductsWithDetails(products, {
        delayMs: 500,
        maxConcurrent: 5,
        defaultBrand: normalizeBrandName(brand, 'Outfitters'),
      });
      console.log(`Successfully enriched ${enrichedProducts.length} products`);
    }

    // Step 3: Save to database if requested
    let savedCount = 0;
    let skippedCount = 0;
    if (save && enrichedProducts.length > 0) {
      try {
        const Sourced = await getSourcedProductModel();
        const requestedBrand = normalizeBrandName(brand, 'Outfitters');
        const collectionSlug = deriveCollectionSlug(collectionUrl);
        
        for (const product of enrichedProducts) {
          try {
            const normalizedTitle = (product.title || 'Untitled').trim().replace(/\s+/g, ' ');
            const normalizedTitleForDedup = normalizeTitleForDedup(normalizedTitle);
            const productBrand = normalizeBrandName(product.brand, requestedBrand);
            const categoryGroup = `Brand:${productBrand}:${collectionSlug}`;
            
            // Check all existing products in this categoryGroup for duplicate title (normalized)
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
            
            await Sourced.findOneAndUpdate(
              { categoryGroup, title: normalizedTitle },
              {
                title: normalizedTitle,
                sourceUrl: product.url,
                categoryGroup,
                brand: productBrand,
                price: product.priceNumber || (product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : undefined),
                description: product.description || '',
                images: (product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])).slice(0, 20),
                specs: product.specifications || {},
              },
              { upsert: true, new: true }
            );
            savedCount++;
          } catch (err: any) {
            // Check if error is due to duplicate key (unique index violation)
            if (err.code === 11000 || err.message?.includes('duplicate')) {
              console.log(`Skipping duplicate product: "${product.title}" (unique index violation)`);
              skippedCount++;
            } else {
              console.error(`Error saving product ${product.url}:`, err.message);
            }
          }
        }
        console.log(`Saved ${savedCount} products to database, skipped ${skippedCount} duplicates`);
      } catch (err: any) {
        console.error('Error saving products to database:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      sourceUrl: collectionUrl,
      pagesVisited,
      count: enrichedProducts.length,
      products: enrichedProducts,
      fetchedDetails: fetchDetails,
      saved: save,
      savedCount: savedCount,
      skippedCount: save ? skippedCount : 0,
    });
  } catch (error: any) {
    console.error('scrape-outfitters error:', error?.message || error);
    return NextResponse.json({ error: `Failed to scrape Outfitters: ${error.message}` }, { status: 500 });
  }
}

