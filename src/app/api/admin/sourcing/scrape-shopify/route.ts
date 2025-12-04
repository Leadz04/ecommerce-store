import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import { getScrapedModels } from '@/models/Scraped';
import { promises as fs } from 'fs';
import path from 'path';

const SHOPIFY_BASE_URL = 'https://www.thejacketmaker.com';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  description?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku?: string;
    available: boolean;
    option1?: string;
    option2?: string;
    option3?: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
  options?: Array<{
    name: string;
    values: string[];
  }>;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

async function fetchShopifyProducts(page = 1, limit = 250): Promise<{ products: ShopifyProduct[]; hasNext: boolean }> {
  try {
    const url = `${SHOPIFY_BASE_URL}/products.json?page=${page}&limit=${limit}`;
    console.log(`[Shopify Scraper] Fetching page ${page} from ${url}`);

    const response = await axios.get<ShopifyProductsResponse>(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const products = response.data.products || [];
    // Shopify typically returns 250 products per page, if we get less, we're on the last page
    const hasNext = products.length === limit;

    return { products, hasNext };
  } catch (error: any) {
    console.error(`[Shopify Scraper] Error fetching page ${page}:`, error.message);
    throw error;
  }
}

async function fetchCollectionProducts(collectionHandle: string): Promise<ShopifyProduct[]> {
  try {
    const url = `${SHOPIFY_BASE_URL}/collections/${collectionHandle}/products.json`;
    console.log(`[Shopify Scraper] Fetching collection: ${collectionHandle}`);

    const response = await axios.get<ShopifyProductsResponse>(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    return response.data.products || [];
  } catch (error: any) {
    console.error(`[Shopify Scraper] Error fetching collection ${collectionHandle}:`, error.message);
    return [];
  }
}

function convertShopifyToScraped(shopifyProduct: ShopifyProduct): any {
  // Get the first available variant price, or first variant if none available
  const firstVariant = shopifyProduct.variants?.[0];
  const price = firstVariant ? parseFloat(firstVariant.price) / 100 : undefined; // Shopify prices are in cents

  // Get all images
  const images = shopifyProduct.images?.map(img => {
    // Convert relative URLs to absolute
    if (img.src.startsWith('//')) {
      return `https:${img.src}`;
    }
    if (img.src.startsWith('/')) {
      return `${SHOPIFY_BASE_URL}${img.src}`;
    }
    return img.src;
  }) || [];

  // Build description from product description
  let description = shopifyProduct.description || '';

  // Add product type and vendor info
  const details: string[] = [];
  if (shopifyProduct.vendor) {
    details.push(`Vendor: ${shopifyProduct.vendor}`);
  }
  if (shopifyProduct.product_type) {
    details.push(`Type: ${shopifyProduct.product_type}`);
  }
  if (shopifyProduct.tags) {
    details.push(`Tags: ${shopifyProduct.tags}`);
  }

  if (details.length > 0) {
    description = `${description}\n\n${details.join('\n')}`.trim();
  }

  // Extract specs from variants
  const specs: Record<string, string> = {};
  if (shopifyProduct.options && shopifyProduct.options.length > 0) {
    shopifyProduct.options.forEach((option, idx) => {
      const values = option.values.join(', ');
      specs[option.name] = values;
    });
  }

  // Get SKU from first variant
  if (firstVariant?.sku) {
    specs['SKU'] = firstVariant.sku;
  }

  return {
    title: shopifyProduct.title,
    description: description || shopifyProduct.title,
    price: price,
    images: images,
    sourceUrl: `${SHOPIFY_BASE_URL}/products/${shopifyProduct.handle}`,
    specs: specs,
    brand: shopifyProduct.vendor || 'The Jacket Maker',
    categoryGroup: shopifyProduct.product_type || 'Jacket',
    raw: {
      shopifyId: shopifyProduct.id,
      handle: shopifyProduct.handle,
      variants: shopifyProduct.variants,
      options: shopifyProduct.options,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { ScrapedProduct } = await getScrapedModels();

    const body = await request.json().catch(() => ({}));
    const {
      scrapeAll = true,
      scrapeCollections = false,
      maxPages = 100,
      collections = [],
    } = body;

    const scrapedProducts: any[] = [];
    const seenHandles = new Set<string>();
    let totalPages = 0;
    let totalProducts = 0;

    // Scrape all products from /products.json
    if (scrapeAll) {
      console.log('[Shopify Scraper] Starting to scrape all products...');
      let page = 1;
      let hasNext = true;

      while (hasNext && page <= maxPages) {
        try {
          const { products, hasNext: hasMore } = await fetchShopifyProducts(page, 250);

          for (const product of products) {
            if (!seenHandles.has(product.handle)) {
              seenHandles.add(product.handle);
              const scraped = convertShopifyToScraped(product);
              scrapedProducts.push(scraped);
              totalProducts++;
            }
          }

          hasNext = hasMore;
          totalPages = page;
          page++;

          // Small delay to avoid rate limiting
          if (hasNext) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          console.error(`[Shopify Scraper] Error on page ${page}:`, error.message);
          // Continue to next page even if one fails
          hasNext = false;
        }
      }

      console.log(`[Shopify Scraper] Scraped ${totalProducts} products from ${totalPages} pages`);
    }

    // Scrape from specific collections
    if (scrapeCollections && collections.length > 0) {
      console.log(`[Shopify Scraper] Scraping ${collections.length} collections...`);

      for (const collectionHandle of collections) {
        try {
          const products = await fetchCollectionProducts(collectionHandle);

          for (const product of products) {
            if (!seenHandles.has(product.handle)) {
              seenHandles.add(product.handle);
              const scraped = convertShopifyToScraped(product);
              scrapedProducts.push(scraped);
              totalProducts++;
            }
          }

          // Small delay between collections
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`[Shopify Scraper] Error scraping collection ${collectionHandle}:`, error.message);
        }
      }
    }

    // Save to database
    let savedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of scrapedProducts) {
      try {
        const existing = await ScrapedProduct.findOne({ sourceUrl: product.sourceUrl });

        if (existing) {
          // Update existing
          await ScrapedProduct.updateOne(
            { sourceUrl: product.sourceUrl },
            {
              $set: {
                title: product.title,
                description: product.description,
                price: product.price,
                images: product.images,
                specs: product.specs,
                brand: product.brand,
                categoryGroup: product.categoryGroup,
                raw: product.raw,
                updatedAt: new Date(),
              },
            }
          );
          updatedCount++;
        } else {
          // Create new
          await ScrapedProduct.create({
            ...product,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          savedCount++;
        }
      } catch (error: any) {
        console.error(`[Shopify Scraper] Error saving product ${product.title}:`, error.message);
        skippedCount++;
      }
    }

    // Also write all scraped products to a JSON file on disk
    try {
      const outDir = path.join(process.cwd(), 'scraped');
      const outFile = path.join(outDir, 'shopify-products.json');

      await fs.mkdir(outDir, { recursive: true });

      const payload = {
        scrapedAt: new Date().toISOString(),
        source: SHOPIFY_BASE_URL,
        totalScraped: totalProducts,
        stats: {
          totalScraped: totalProducts,
          totalPages,
          saved: savedCount,
          updated: updatedCount,
          skipped: skippedCount,
        },
        products: scrapedProducts,
      };

      await fs.writeFile(outFile, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('[Shopify Scraper] Wrote JSON export to', outFile);
    } catch (fileError: any) {
      console.error('[Shopify Scraper] Failed to write JSON export:', fileError?.message || fileError);
    }

    return NextResponse.json({
      success: true,
      message: `Scraped ${totalProducts} products from Shopify`,
      stats: {
        totalScraped: totalProducts,
        totalPages,
        saved: savedCount,
        updated: updatedCount,
        skipped: skippedCount,
      },
      products: scrapedProducts.slice(0, 10), // Return first 10 as sample
    });
  } catch (error: any) {
    console.error('[Shopify Scraper] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scrape Shopify products',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '250');

    const { products, hasNext } = await fetchShopifyProducts(page, limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        hasNext,
      },
    });
  } catch (error: any) {
    console.error('[Shopify Scraper] GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

