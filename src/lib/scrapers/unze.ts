import { MappedProduct, ScrapeResult } from './types';
import { mapCategory, extractTags, cleanImageUrl, stripHtml, mapSpecifications, convertPrice, fetchShopifyProducts } from './utils';

export async function scrapeUnze(options: { limit?: number } = {}): Promise<ScrapeResult> {
    const baseUrl = 'https://unze.com.pk/products.json';
    const products: MappedProduct[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 250;

    console.log(`[Unze] Starting scrape...`);

    try {
        while (hasMore) {
            console.log(`[Unze] Fetching page ${page}...`);

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
                const price = firstVariant ? convertPrice(firstVariant.price) : 0;
                const originalPrice = firstVariant?.compare_at_price ? convertPrice(firstVariant.compare_at_price) : undefined;

                const images = product.images?.map(img => cleanImageUrl(img.src, 'https://unze.com.pk')) || [];
                if (images.length === 0 && product.image) {
                    images.push(cleanImageUrl(product.image.src, 'https://unze.com.pk'));
                }

                const mappedProduct: MappedProduct = {
                    name: product.title,
                    description: description,
                    descriptionHtml: product.body_html,
                    price: price,
                    originalPrice: originalPrice,
                    image: images[0] || '',
                    images: images,
                    category: category,
                    brand: 'unze',
                    sourceUrl: `https://unze.com.pk/products/${product.handle}`,
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
        console.error(`[Unze] Error: ${error.message}`);
    }

    return {
        brand: 'unze',
        source: baseUrl,
        scrapedAt: new Date().toISOString(),
        totalProducts: products.length,
        products: products
    };
}
