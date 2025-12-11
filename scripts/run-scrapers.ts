import fs from 'fs';
import path from 'path';
import { scrapeNineNineNine } from '../src/lib/scrapers/nineNineNine';
import { scrapeUnze } from '../src/lib/scrapers/unze';
import { scrapeEngine } from '../src/lib/scrapers/engine';
import { scrapeAlmas } from '../src/lib/scrapers/almas';
import { scrapeBeOneShopOne } from '../src/lib/scrapers/beoneshopone';
import { scrapeBreakout } from '../src/lib/scrapers/breakout';
import { scrapeFurorJeans } from '../src/lib/scrapers/furorjeans';
import { scrapeHustleNHolla } from '../src/lib/scrapers/hustlenholla';

async function main() {
    console.log('🚀 Starting Brand Scrapers (JSON ONLY)...');

    const scrapedDir = path.join(process.cwd(), 'scraped');
    if (!fs.existsSync(scrapedDir)) {
        fs.mkdirSync(scrapedDir, { recursive: true });
    }

    const scrapers = [
        { name: '999pk', fn: scrapeNineNineNine },
        { name: 'Unze', fn: scrapeUnze },
        { name: 'Engine', fn: scrapeEngine },
        { name: 'Almas', fn: scrapeAlmas },
        { name: 'BeOneShopOne', fn: scrapeBeOneShopOne },
        { name: 'Breakout', fn: scrapeBreakout },
        { name: 'FurorJeans', fn: scrapeFurorJeans },
        { name: 'HustleNHolla', fn: scrapeHustleNHolla }
    ];

    for (const scraper of scrapers) {
        console.log(`\n--------------------------------------------------`);
        console.log(`📦 Running scraper for: ${scraper.name}`);
        console.log(`--------------------------------------------------`);

        try {
            const result = await scraper.fn(); // No limit for production run

            const fileName = `${scraper.name.toLowerCase().replace(/\s+/g, '')}-products.json`;
            const filePath = path.join(scrapedDir, fileName);

            fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
            console.log(`✅ Saved ${result.totalProducts} products to ${fileName}`);
        } catch (error: any) {
            console.error(`❌ Error scraping ${scraper.name}:`, error.message);
        }
    }

    console.log(`\n🎉 All scrapers finished! Check the 'scraped' directory.`);
}

main().catch(console.error);
