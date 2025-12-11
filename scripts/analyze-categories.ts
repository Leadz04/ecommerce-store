import fs from 'fs';
import path from 'path';

async function main() {
    const scrapedDir = path.join(process.cwd(), 'scraped');
    if (!fs.existsSync(scrapedDir)) {
        console.error('Scraped directory not found');
        return;
    }

    const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));

    const categoryCounts: Record<string, number> = {};
    const productTypeCounts: Record<string, number> = {};
    const brandCategories: Record<string, Set<string>> = {};

    console.log('Analyzing categories for files:', files);

    for (const file of files) {
        const content = JSON.parse(fs.readFileSync(path.join(scrapedDir, file), 'utf-8'));
        const products = Array.isArray(content) ? content : content.products;

        if (!products || products.length === 0) continue;

        const brandName = file.replace('-products.json', '');
        brandCategories[brandName] = new Set();

        for (const product of products) {
            // Analyze 'category' (our mapped field)
            const cat = product.category || 'Uncategorized';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            brandCategories[brandName].add(cat);

            // Analyze 'productType' (raw shopify field)
            if (product.productType) {
                const type = product.productType.trim() || 'Unknown';
                productTypeCounts[type] = (productTypeCounts[type] || 0) + 1;
            }
        }
    }

    let report = 'CATEGORY ANALYSIS REPORT\n';
    report += '==================================================\n\n';

    report += 'Current "Mapped" Categories Distribution:\n';
    Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([cat, count]) => {
            report += `- ${cat}: ${count}\n`;
        });

    report += '\nOriginal "ProductType" Distribution (Top 50):\n';
    Object.entries(productTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 50)
        .forEach(([type, count]) => {
            report += `- ${type}: ${count}\n`;
        });

    report += '\nCategories per Brand:\n';
    Object.entries(brandCategories).forEach(([brand, cats]) => {
        report += `- ${brand}: ${Array.from(cats).join(', ')}\n`;
    });

    fs.writeFileSync('category_analysis.txt', report, 'utf-8');
    console.log('Report written to category_analysis.txt');
}

main();
