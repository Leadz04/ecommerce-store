import fs from 'fs';
import path from 'path';
import { scrapeLamaRetail } from '../src/lib/scrapers/lamaretail';

async function main() {
    console.log('🚀 Starting Lama Retail Scraper...');

    const scrapedDir = path.join(process.cwd(), 'scraped');
    if (!fs.existsSync(scrapedDir)) {
        fs.mkdirSync(scrapedDir, { recursive: true });
    }

    try {
        const result = await scrapeLamaRetail(); // No limit for production run

        const fileName = 'lamaretail-products.json';
        const filePath = path.join(scrapedDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
        console.log(`✅ Saved ${result.totalProducts} products to ${fileName}`);
    } catch (error: any) {
        console.error(`❌ Error scraping Lama Retail:`, error.message);
    }

    console.log(`\n🎉 Scraper finished! Check the 'scraped/lamaretail-products.json' file.`);
}

main().catch(console.error);
