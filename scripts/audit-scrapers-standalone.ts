import axios from 'axios';

// --- Utils (Inlined) ---
async function fetchShopify(url: string) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return response.data.products?.[0];
    } catch (e: any) {
        console.log(`Failed to fetch ${url}: ${e.message}`);
        return null;
    }
}

// Audit List
const targets = [
    { name: '999pk', url: 'https://999.com.pk/products.json?limit=1' },
    { name: 'Engine', url: 'https://engine.com.pk/products.json?limit=1' },
    { name: 'Almas', url: 'https://almas.pk/products.json?limit=1' },
    { name: 'BeOneShopOne', url: 'https://beoneshopone.com/products.json?limit=1' },
    { name: 'Breakout', url: 'https://breakout.com.pk/products.json?limit=1' },
    { name: 'FurorJeans', url: 'https://furorjeans.com/products.json?limit=1' },
    { name: 'HustleNHolla', url: 'https://hustlenholla.com/products.json?limit=1' }
];

async function main() {
    console.log('🔍 Auditing Shopify Data Quality...\n');

    for (const t of targets) {
        console.log(`\n--- ${t.name} ---`);
        const raw = await fetchShopify(t.url);

        if (!raw) {
            console.log('❌ No Data');
            continue;
        }

        const rawKeys = Object.keys(raw);
        console.log(`Raw Keys Available: ${rawKeys.length}`);

        // Critical Fields Check
        const checks = {
            'Tags': !!(raw.tags && raw.tags.length),
            'Variants': !!(raw.variants && raw.variants.length),
            'Options': !!(raw.options && raw.options.length),
            'Vendor': !!raw.vendor,
            'ProductType': !!raw.product_type,
            'BodyHTML (Desc)': !!raw.body_html,
            'Images': !!(raw.images && raw.images.length > 1)
        };

        const availableData = Object.entries(checks).filter(([_, exists]) => exists).map(([k]) => k);
        const missingData = Object.entries(checks).filter(([_, exists]) => !exists).map(([k]) => k);

        console.log(`✅ Available: ${availableData.join(', ')}`);
        if (missingData.length > 0) {
            console.log(`⚠️  Missing/Empty in Raw: ${missingData.join(', ')}`);
        } else {
            console.log(`✨  Rich Data Source`);
        }
    }
}

main();
