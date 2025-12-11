import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- Utils ---
function cleanImageUrl(src: string, baseUrl: string): string {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    if (src.startsWith('/')) {
        const origin = new URL(baseUrl).origin;
        return `${origin}${src}`;
    }
    return src;
}

function stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapCategory(productType?: string, vendor?: string): string {
    const text = ((productType || '') + ' ' + (vendor || '')).toLowerCase();
    if (text.includes('men') || text.includes("men's")) return 'Men';
    if (text.includes('women') || text.includes("women's") || text.includes('wo')) return 'Women';
    if (text.includes('kid') || text.includes('child')) return 'Kids';
    return 'Accessories';
}

function mapSpecifications(product: any): Record<string, string> {
    const specs: Record<string, string> = {};
    if (product.vendor) specs.Vendor = product.vendor;
    if (product.product_type) specs.Type = product.product_type;
    if (product.tags) {
        const tags = Array.isArray(product.tags) ? product.tags : product.tags.split(',').map((t: string) => t.trim());
        specs.Tags = tags.join(', ');
    }
    
    // Extract options as specs
    if (product.options && Array.isArray(product.options)) {
        product.options.forEach((option: any) => {
            if (option.name && option.values && option.values.length > 0) {
                specs[option.name] = Array.isArray(option.values) ? option.values.join(', ') : option.values;
            }
        });
    }
    
    return specs;
}

// --- Helper function to fetch with retry and better headers ---
async function fetchWithRetry(url: string, params: any, maxRetries = 3): Promise<any> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            const response = await axios.get(url, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': 'https://outfitters.com.pk/',
                    'Origin': 'https://outfitters.com.pk',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Connection': 'keep-alive'
                },
                timeout: 30000,
                validateStatus: (status) => status < 500, // Don't throw on 4xx
            });

            // Check if we got a Cloudflare challenge page
            if (response.status === 403 || (typeof response.data === 'string' && response.data.includes('cf-challenge'))) {
                throw new Error('Cloudflare challenge detected');
            }

            // Check if response is JSON
            if (typeof response.data === 'string') {
                throw new Error('Received HTML instead of JSON (likely Cloudflare challenge)');
            }

            return response.data;
        } catch (error: any) {
            attempt++;
            const is403 = error.response?.status === 403;
            const isCloudflare = error.message?.includes('Cloudflare') || 
                                (error.response?.data && typeof error.response.data === 'string' && 
                                 error.response.data.includes('cf-challenge'));
            
            if (is403 || isCloudflare) {
                console.warn(`   ⚠️  Attempt ${attempt}/${maxRetries}: Cloudflare protection detected. Waiting...`);
            } else {
                console.warn(`   ⚠️  Attempt ${attempt}/${maxRetries}: ${error.message}`);
            }

            if (attempt >= maxRetries) {
                throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
            }

            // Exponential backoff with longer delay for Cloudflare
            const delay = (is403 || isCloudflare) ? 3000 * attempt : 1000 * attempt;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Failed to fetch after retries');
}

// --- Main Scraper Function ---
async function fetchOutfittersProducts() {
    console.log('🚀 Starting Outfitters Product Scraper...');
    const baseUrl = 'https://outfitters.com.pk';
    const apiUrl = `${baseUrl}/products.json`;
    const limit = 250; // Shopify default limit per page
    let page = 1;
    let allProducts: any[] = [];
    let hasMore = true;

    try {
        // Fetch all pages
        while (hasMore) {
            console.log(`📦 Fetching page ${page}...`);
            
            const data = await fetchWithRetry(apiUrl, { page, limit });
            const pageProducts = data.products || [];
            
            console.log(`   ✅ Found ${pageProducts.length} products on page ${page}`);

            if (pageProducts.length === 0) {
                hasMore = false;
                break;
            }

            allProducts.push(...pageProducts);

            // If we got less than the limit, we're on the last page
            if (pageProducts.length < limit) {
                hasMore = false;
            } else {
                page++;
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n✅ Fetched ${allProducts.length} total products. Processing...`);

        // Map products to our format
        const mappedProducts = [];

        for (const product of allProducts) {
            // Get images
            const images = product.images?.map((img: any) => cleanImageUrl(img.src, baseUrl)) || [];
            if (images.length === 0 && product.image) {
                images.push(cleanImageUrl(product.image.src || product.image, baseUrl));
            }

            // Get price from first available variant, or first variant
            const availableVariant = product.variants?.find((v: any) => v.available) || product.variants?.[0];
            const price = availableVariant ? parseFloat(availableVariant.price || '0') : 0;
            const compareAtPrice = availableVariant?.compare_at_price ? parseFloat(availableVariant.compare_at_price) : undefined;

            // Build description
            let description = stripHtml(product.body_html);
            if (!description && product.title) {
                description = product.title;
            }

            // Map category
            const category = mapCategory(product.product_type, product.vendor);
            const productType = product.product_type || 'Uncategorized';

            const mapped = {
                name: product.title,
                brand: product.vendor || 'Outfitters',
                price: price,
                originalPrice: compareAtPrice || price,
                image: images[0] || '',
                images: images,
                department: category,
                category: productType,
                subCategory: productType,
                sourceUrl: `${baseUrl}/products/${product.handle}`,
                description: description,
                descriptionHtml: product.body_html || '',
                specifications: mapSpecifications(product),
                inStock: availableVariant?.available !== false,
                stockCount: 0, // Not available in Shopify API
                tags: Array.isArray(product.tags) ? product.tags : (product.tags ? product.tags.split(',').map((t: string) => t.trim()) : []),
                raw: {
                    shopifyId: product.id,
                    handle: product.handle,
                    variants: product.variants,
                    options: product.options,
                    publishedAt: product.published_at,
                    createdAt: product.created_at,
                    updatedAt: product.updated_at
                }
            };

            mappedProducts.push(mapped);
        }

        // Save to JSON file
        const outDir = path.join(process.cwd(), 'scraped');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const output = {
            brand: 'Outfitters',
            source: baseUrl,
            scrapedAt: new Date().toISOString(),
            totalProducts: mappedProducts.length,
            totalPages: page,
            products: mappedProducts
        };

        const fileName = 'outfitters-products.json';
        const filePath = path.join(outDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
        console.log(`\n✅ Saved ${mappedProducts.length} products to scraped/${fileName}`);
        console.log(`📊 Stats:`);
        console.log(`   - Total products: ${mappedProducts.length}`);
        console.log(`   - Pages fetched: ${page}`);
        console.log(`   - File: ${filePath}`);

    } catch (error: any) {
        console.error('❌ Error fetching Outfitters products:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        process.exit(1);
    }
}

// Run the scraper
fetchOutfittersProducts().catch(console.error);

