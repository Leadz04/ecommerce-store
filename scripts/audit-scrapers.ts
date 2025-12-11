import axios from 'axios';
import { scrapeNineNineNine } from '../src/lib/scrapers/nineNineNine';
import { scrapeUnze } from '../src/lib/scrapers/unze';
import { scrapeEngine } from '../src/lib/scrapers/engine';
import { scrapeAlmas } from '../src/lib/scrapers/almas';
import { scrapeBeOneShopOne } from '../src/lib/scrapers/beoneshopone';
import { scrapeBreakout } from '../src/lib/scrapers/breakout';
import { scrapeFurorJeans } from '../src/lib/scrapers/furorjeans';
import { scrapeHustleNHolla } from '../src/lib/scrapers/hustlenholla';

async function audit() {
    console.log('🔍 Auditing Scrapers: Comparing Raw vs Mapped Data...\n');

    const scrapers = [
        { name: '999pk', fn: scrapeNineNineNine, url: 'https://999.com.pk/products.json?limit=1' },
        // Unze might be different, let's assume valid shopify for now or check scraper
        { name: 'Engine', fn: scrapeEngine, url: 'https://engine.com.pk/products.json?limit=1' },
        { name: 'Almas', fn: scrapeAlmas, url: 'https://almas.pk/products.json?limit=1' },
        { name: 'BeOneShopOne', fn: scrapeBeOneShopOne, url: 'https://beoneshopone.com/products.json?limit=1' },
        { name: 'Breakout', fn: scrapeBreakout, url: 'https://breakout.com.pk/products.json?limit=1' },
        { name: 'FurorJeans', fn: scrapeFurorJeans, url: 'https://furorjeans.com/products.json?limit=1' },
        { name: 'HustleNHolla', fn: scrapeHustleNHolla, url: 'https://hustlenholla.com/products.json?limit=1' }
    ];

    for (const scraper of scrapers) {
        console.log(`\n--- Auditing ${scraper.name} ---`);
        try {
            // 1. Fetch Raw
            const rawRes = await axios.get(scraper.url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const rawProduct = rawRes.data.products?.[0];

            if (!rawProduct) {
                console.log('❌ Could not fetch raw product.');
                continue;
            }

            // 2. Run Scraper (Limit 1)
            const result = await scraper.fn({ limit: 1 });
            const mappedProduct = result.products[0];

            if (!mappedProduct) {
                console.log('❌ Scraper returned no products.');
                continue;
            }

            // 3. Compare
            const rawKeys = Object.keys(rawProduct);
            const mappedRawKeys = mappedProduct.raw ? Object.keys(mappedProduct.raw) : [];

            // Check specific fields often missed
            console.log(`Raw Keys: ${rawKeys.length} | Scraped 'raw' Keys: ${mappedRawKeys.length}`);

            const missingHighValueFields = [];
            if (rawProduct.tags && (!mappedProduct.tags || mappedProduct.tags.length === 0)) missingHighValueFields.push('tags');
            if (rawProduct.variants?.length > 1 && (!mappedProduct.raw?.variants || mappedProduct.raw.variants.length < 2)) missingHighValueFields.push('variants');
            if (rawProduct.options && !mappedProduct.specifications) missingHighValueFields.push('options/specs');

            if (missingHighValueFields.length > 0) {
                console.log(`⚠️  Potential Missing Information: ${missingHighValueFields.join(', ')}`);
            } else {
                console.log('✅  Key data structures seem preserved.');
            }

            // Log size comparison
            const rawSize = JSON.stringify(rawProduct).length;
            const mappedSize = JSON.stringify(mappedProduct).length;
            console.log(`Data Retention: ${Math.round((mappedSize / rawSize) * 100)}% of raw size.`);

        } catch (e: any) {
            console.log(`❌ Error: ${e.message}`);
        }
    }
}

audit();
