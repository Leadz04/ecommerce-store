import { MappedProduct, ScrapeResult } from './types';
import { mapCategory, extractTags, cleanImageUrl, stripHtml, mapSpecifications, fetchShopifyProducts } from './utils';

// Special price converter for 999pk which sometimes has low numbers needing x100
function convertPrice999(price: string | number): number {
    if (typeof price === 'number') {
        return price < 100 ? Math.round(price * 100) : price;
    }
    if (typeof price === 'string') {
        const num = parseFloat(price);
        return isNaN(num) ? 0 : (num < 100 ? Math.round(num * 100) : num);
    }
    return 0;
}

export async function scrapeNineNineNine(options: { limit?: number } = {}): Promise<ScrapeResult> {
    const baseUrl = 'https://999.com.pk/products.json';
    const products: MappedProduct[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 250;

    console.log(`[999.com.pk] Starting scrape...`);

    try {
        while (hasMore) {
            console.log(`[999.com.pk] Fetching page ${page}...`);

            const pageProducts = await fetchShopifyProducts(baseUrl, page, limit);

            if (pageProducts.length === 0) {
                hasMore = false;
                break;
            }

            for (const product of pageProducts) {
                if (!product.title || !product.handle) continue;

                const description = stripHtml(product.body_html) || product.title;
                const mappedTags = extractTags(description, product.title, product.product_type, product.tags);
                const category = mapCategory(product.product_type, product.vendor, mappedTags);

                const firstVariant = product.variants?.[0];
                const price = firstVariant ? convertPrice999(firstVariant.price) : 0;
                const originalPrice = firstVariant?.compare_at_price ? convertPrice999(firstVariant.compare_at_price) : undefined;

                const images = product.images?.map(img => cleanImageUrl(img.src, 'https://999.com.pk')) || [];

                // DEBUG: Log first product's images
                if (products.length === 0) {
                    console.log('[DEBUG 999pk] First Product Images Raw:', JSON.stringify(product.images, null, 2));
                    console.log('[DEBUG 999pk] Cleaned Images:', images);
                }

                if (images.length === 0 && product.image) {
                    images.push(cleanImageUrl(product.image.src, 'https://999.com.pk'));
                }

                const primaryImage = images[0] || '';
                const sourceUrl = `https://999.com.pk/products/${product.handle}`;

                const mappedProduct: MappedProduct = {
                    name: product.title,
                    description: description,
                    descriptionHtml: product.body_html,
                    price: price,
                    originalPrice: originalPrice,
                    image: primaryImage,
                    images: images,
                    category: category,
                    brand: '999pk',
                    sourceUrl: sourceUrl,
                    productType: product.product_type || '',
                    tags: mappedTags,
                    specifications: mapSpecifications(product),
                    status: 'draft',
                    isActive: true,
                    inStock: true,
                    rating: 0,
                    reviewCount: 0,
                    stockCount: 0,
                    raw: {
                        shopifyId: product.id,
                        handle: product.handle,
                        variants: product.variants,
                        options: product.options,
                        vendor: product.vendor,
                        product_type: product.product_type
                    }
                };

                products.push(mappedProduct);
            }

            if (pageProducts.length < limit) {
                hasMore = false;
            } else {
                page++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (options.limit && products.length >= options.limit) break;
        }
    } catch (error: any) {
        console.error(`[999.com.pk] Error: ${error.message}`);
    }

    return {
        brand: '999pk',
        source: baseUrl,
        scrapedAt: new Date().toISOString(),
        totalProducts: products.length,
        products: products
    };
}
