import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- Utils (Inlined) ---
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
    return html.replace(/<[^>]*>/g, ' ').trim();
}

function mapCategory(productType?: string): string {
    const text = (productType || '').toLowerCase();
    if (text.includes('men') || text.includes("men's")) return 'Men';
    if (text.includes('women') || text.includes("women's")) return 'Women';
    return 'Accessories';
}

function mapSpecifications(product: any): Record<string, string> {
    const specs: Record<string, string> = {
        Vendor: product.vendor,
        Type: product.product_type
    };
    if (product.tags) specs.Tags = Array.isArray(product.tags) ? product.tags.join(', ') : product.tags;
    return specs;
}

// --- Scraper Logic ---
async function scrape999() {
    console.log('[Debug] Starting 999pk standalone scrape...');
    const baseUrl = 'https://999.com.pk/products.json';
    const limit = 50;

    try {
        const response = await axios.get(`${baseUrl}?page=1&limit=${limit}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        const pageProducts = response.data.products || [];
        console.log(`[Debug] Fetched ${pageProducts.length} raw products.`);

        const mappedProducts = [];

        for (const product of pageProducts) {
            // DEBUG LOGGING SPECIFICALLY FOR IMAGES
            if (mappedProducts.length === 0) {
                console.log('[Debug] First Product Images Raw:', JSON.stringify(product.images, null, 2));
            }

            const images = product.images?.map((img: any) => cleanImageUrl(img.src, 'https://999.com.pk')) || [];
            if (images.length === 0 && product.image) {
                images.push(cleanImageUrl(product.image.src, 'https://999.com.pk'));
            }

            const mapped = {
                name: product.title,
                brand: '999pk',
                price: parseFloat(product.variants?.[0]?.price || '0'),
                image: images[0] || '',
                images: images,
                department: mapCategory(product.product_type),
                category: product.product_type || 'Uncategorized',
                subCategory: product.product_type || 'Uncategorized',
                sourceUrl: `https://999.com.pk/products/${product.handle}`,
                description: stripHtml(product.body_html),
                specifications: mapSpecifications(product)
            };
            mappedProducts.push(mapped);
        }

        // Save
        const outDir = path.join(process.cwd(), 'scraped');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(path.join(outDir, '999pk-products.json'), JSON.stringify({
            brand: '999pk',
            totalProducts: mappedProducts.length,
            products: mappedProducts
        }, null, 2));

        console.log(`[Debug] Saved ${mappedProducts.length} products to scraped/999pk-products.json`);

    } catch (e: any) {
        console.error('[Debug] Error:', e.message);
    }
}

scrape999();
