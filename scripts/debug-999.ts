import fs from 'fs';
import path from 'path';
import { scrapeNineNineNine } from '../src/lib/scrapers/nineNineNine';

async function main() {
    console.log('🚀 Debugging 999pk Scraper...');
    const result = await scrapeNineNineNine({ limit: 50 }); // Fetch first 50 items for test

    const fileName = '999pk-products.json';
    const filePath = path.join(process.cwd(), 'scraped', fileName);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

    console.log(`✅ Saved ${result.totalProducts} products to ${fileName}`);
}

main().catch(console.error);
