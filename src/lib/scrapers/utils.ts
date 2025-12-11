import axios from 'axios';
import { ShopifyProduct, ShopifyVariant, ShopifyProductsResponse } from './types';

// Shared fetcher with robust headers and retry logic
export async function fetchShopifyProducts(baseUrl: string, page: number, limit: number): Promise<ShopifyProduct[]> {
    const url = `${baseUrl}?page=${page}&limit=${limit}`;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await axios.get<ShopifyProductsResponse>(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin'
                }
            });
            return response.data.products || [];
        } catch (error: any) {
            attempt++;
            const is403 = error.response && error.response.status === 403;
            console.warn(`[Fetcher] Attempt ${attempt} failed for ${url}: ${error.message} ${is403 ? '(403 Forbidden)' : ''}`);

            if (attempt >= maxRetries) {
                throw error;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    return [];
}


// Helper function to map categoryGroup to category
export function mapCategory(productType?: string, vendor?: string, tags?: string[]): string {
    const text = `${productType || ''} ${vendor || ''} ${tags ? tags.join(' ') : ''}`.toLowerCase();

    if (text.includes('men') || text.includes("men's")) return 'Men';
    if (text.includes('women') || text.includes("women's") || text.includes('girls') || text.includes('ladies')) return 'Women';
    if (text.includes('office') || text.includes('travel') || text.includes('formal')) return 'Office & Travel';
    if (text.includes('gift')) return 'Gifting';
    if (text.includes('accessor') || text.includes('bag') || text.includes('wallet') || text.includes('belt') || text.includes('scarf') || text.includes('jewel')) return 'Accessories';

    // Default based on common patterns
    return 'Accessories';
}

// Helper function to extract tags
export function extractTags(description: string, title: string, productType?: string, tags?: string[] | string): string[] {
    const extractedTags: string[] = [];
    const text = `${description} ${title} ${productType || ''}`.toLowerCase();

    // Common tags list
    const commonTags = [
        'leather', 'jacket', 'coat', 'puffer', 'bomber', 'varsity', 'hooded', 'dress',
        'trouser', 'pant', 'shirt', 'sweater', 'shacket', 'cardigan', 'shawl', 'hoodie',
        'blazer', 'suit', 'denim', 'sweatshirt', 'shoe', 'footwear', 'boots', 'sandals',
        'heels', 'flats', 'sneakers', 'bag', 'handbag', 'clutch', 'wallet', 'vest',
        'boxer', 'underwear', 'top', 't-shirt', 'polo', 'kurta', 'shalwar', 'kameez',
        'eastern', 'western', 'winter', 'summer', 'lawn', 'cotton', 'linen', 'silk',
        'chiffon', 'velvet', 'khaddar', 'wool', 'fleece', 'thermal'
    ];

    commonTags.forEach(tag => {
        if (text.includes(tag)) extractedTags.push(tag);
    });

    // Add tags from Shopify tags
    if (tags) {
        if (Array.isArray(tags)) {
            extractedTags.push(...tags.filter(tag => tag && typeof tag === 'string'));
        } else if (typeof tags === 'string') {
            // Sometimes tags are a comma-separated string
            extractedTags.push(...tags.split(',').map(t => t.trim()));
        }
    }

    return [...new Set(extractedTags)]; // Remove duplicates
}

// Helper function to convert price
export function convertPrice(price: string | number): number {
    if (typeof price === 'number') {
        // If price is very small (like < 1000) and it's PK, it might be needing multiplication if logic dictates,
        // but usually Shopify API returns standard units or cents.
        // Based on previous code, 999pk handled cents logic.
        // We'll trust the input for now but maybe adding a check for very small numbers if needed.
        return Math.round(price);
    }
    if (typeof price === 'string') {
        // Remove currency symbols and commas
        const cleanPrice = price.replace(/[^0-9.]/g, '');
        const num = parseFloat(cleanPrice);
        return isNaN(num) ? 0 : Math.round(num);
    }
    return 0;
}

// Helper function to clean image URL
export function cleanImageUrl(src: string, baseUrl: string): string {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    if (src.startsWith('/')) {
        const origin = new URL(baseUrl).origin;
        return `${origin}${src}`;
    }
    return src;
}

// Helper function to strip HTML
export function stripHtml(html?: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

// Helper function to map variants
export function mapVariants(variants: ShopifyVariant[]): any[] {
    if (!variants || !Array.isArray(variants)) return [];

    return variants.map(variant => ({
        title: variant.title || 'Default',
        sku: variant.sku || null,
        price: convertPrice(variant.price),
        originalPrice: variant.compare_at_price ? convertPrice(variant.compare_at_price) : undefined,
        available: variant.available !== false,
        inventory: variant.inventory_quantity || null,
        options: {
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3
        }
    }));
}

// Helper function to map specifications
export function mapSpecifications(product: ShopifyProduct): Record<string, string> {
    const specifications: Record<string, string> = {};

    if (product.vendor) {
        specifications.Vendor = product.vendor;
    }
    if (product.product_type) {
        specifications.Type = product.product_type;
    }

    const tagsStr = Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '');
    if (tagsStr) {
        specifications.Tags = tagsStr;
    }

    // Add options as specifications
    if (product.options && Array.isArray(product.options)) {
        product.options.forEach(option => {
            if (option.values && option.values.length > 0) {
                specifications[option.name] = option.values.join(', ');
            }
        });
    }

    return specifications;
}
