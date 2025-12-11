import fs from 'fs';
import path from 'path';

const scrapedDir = path.join(process.cwd(), 'scraped');

function analyzeImages() {
    if (!fs.existsSync(scrapedDir)) {
        console.log('No scraped directory found.');
        return;
    }

    const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));
    // Structure: brand -> category -> { single: number, multi: number }
    const stats: Record<string, Record<string, { single: number; multi: number }>> = {};

    console.log('Analyzing image data across brands (Breakdown by Category)...\n');

    for (const file of files) {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(scrapedDir, file), 'utf-8'));
            const products = Array.isArray(content) ? content : content.products;

            if (!Array.isArray(products)) continue;

            const brandName = file.replace('-products.json', '');
            stats[brandName] = {};

            for (const p of products) {
                // Determine category (fallback to 'Uncategorized' if missing)
                const cat = p.category || p.department || 'Uncategorized';

                if (!stats[brandName][cat]) {
                    stats[brandName][cat] = { single: 0, multi: 0 };
                }

                const hasMultiple = p.images && Array.isArray(p.images) && p.images.length > 1;

                if (hasMultiple) {
                    stats[brandName][cat].multi++;
                } else {
                    stats[brandName][cat].single++;
                }
            }
        } catch (e) {
            console.error(`Error reading ${file}`);
        }
    }

    // Print Report
    for (const [brand, categories] of Object.entries(stats)) {
        console.log(`\n=== ${brand.toUpperCase()} ===`);
        console.log('CATEGORY'.padEnd(25) + 'SINGLE'.padEnd(10) + 'MULTI'.padEnd(10) + '% MULTI');
        console.log('-'.repeat(55));

        for (const [cat, data] of Object.entries(categories)) {
            const total = data.single + data.multi;
            const percentage = total > 0 ? ((data.multi / total) * 100).toFixed(1) + '%' : '0%';
            console.log(
                cat.padEnd(25) +
                String(data.single).padEnd(10) +
                String(data.multi).padEnd(10) +
                percentage
            );
        }
    }
}

analyzeImages();
