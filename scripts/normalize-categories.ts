import fs from 'fs';
import path from 'path';

// Types for our new schema
interface NormalizedProduct {
    // ... existing fields
    department: string;
    category: string;
    subCategory: string;
    [key: string]: any;
}

// Mapping Logic
function normalizeProduct(product: any): { department: string; category: string; subCategory: string } {
    const type = (product.productType || '').toLowerCase().trim();
    const rawTags = (product.tags || []).map((t: string) => t.toLowerCase());
    const title = (product.name || '').toLowerCase();

    let department = 'Unisex';
    let category = 'Unknown';
    let subCategory = 'Other';

    // 1. Determine Department
    if (type.includes('men') && !type.includes('women')) department = 'Men';
    else if (type.includes('women') || type.includes('lady') || type.includes('ladies')) department = 'Women';
    else if (type.includes('boy')) department = 'Kids (Boys)';
    else if (type.includes('girl')) department = 'Kids (Girls)';
    else if (type.includes('kid')) department = 'Kids';

    // Refine Department based on brand/context if ambiguous
    if (department === 'Unisex') {
        if (title.includes('men') && !title.includes('women')) department = 'Men';
        if (title.includes('women') || title.includes('ladies')) department = 'Women';
    }

    // 2. Determine Category (Clothing, Footwear, Accessories, Fragrance)
    if (
        type.includes('shoe') || type.includes('footwear') || type.includes('boot') ||
        type.includes('sandal') || type.includes('slipper') || type.includes('heel') ||
        type.includes('flat') || type.includes('moccasin') || type.includes('trainer') ||
        type.includes('pump') || type.includes('wedge') || type.includes('khussa') ||
        type.includes('chappal') || type.includes('slide')
    ) {
        category = 'Footwear';
    } else if (
        type.includes('bag') || type.includes('wallet') || type.includes('belt') ||
        type.includes('hat') || type.includes('cap') || type.includes('scarf') ||
        type.includes('jewelry') || type.includes('socks') || type.includes('glasses') ||
        type.includes('keychain') || type.includes('perfume') || type.includes('fragrance')
    ) {
        category = 'Accessories';
    } else if (
        type.includes('shirt') || type.includes('pant') || type.includes('trouser') ||
        type.includes('jean') || type.includes('top') || type.includes('dress') ||
        type.includes('kurta') || type.includes('suit') || type.includes('jacket') ||
        type.includes('coat') || type.includes('sweater') || type.includes('hoodie') ||
        type.includes('tee') || type.includes('knit') || type.includes('woven') ||
        type.includes('bottom') || type.includes('upper') || type.includes('polo')
    ) {
        category = 'Clothing';
    } else {
        // Fallback: Check title or tags
        if (title.includes('shoes') || title.includes('sandal')) category = 'Footwear';
        else if (title.includes('shirt') || title.includes('pant')) category = 'Clothing';
        else category = 'Unknown';
    }

    // 3. Determine SubCategory
    if (category === 'Footwear') {
        if (type.includes('sandal') || title.includes('sandal')) subCategory = 'Sandals';
        else if (type.includes('slipper') || title.includes('slipper')) subCategory = 'Slippers';
        else if (type.includes('heel')) subCategory = 'Heels';
        else if (type.includes('flat')) subCategory = 'Flats';
        else if (type.includes('boot')) subCategory = 'Boots';
        else if (type.includes('trainer') || type.includes('sneaker')) subCategory = 'Sneakers';
        else if (type.includes('formal') || type.includes('moccasin')) subCategory = 'Formal Shoes';
        else subCategory = 'Other Footwear';
    } else if (category === 'Accessories') {
        if (type.includes('bag') || type.includes('clutch')) subCategory = 'Bags';
        else if (type.includes('wallet')) subCategory = 'Wallets';
        else if (type.includes('belt')) subCategory = 'Belts';
        else if (type.includes('fragrance') || type.includes('perfume')) subCategory = 'Fragrances';
        else if (type.includes('cap') || type.includes('hat')) subCategory = 'Headwear';
        else if (type.includes('sock')) subCategory = 'Socks';
        else subCategory = 'Other Accessories';
    } else if (category === 'Clothing') {
        if (type.includes('shirt') || type.includes('top') || type.includes('tee') || type.includes('polo') || type.includes('sweater') || type.includes('hoodie')) subCategory = 'Topwear';
        else if (type.includes('pant') || type.includes('trouser') || type.includes('jean') || type.includes('bottom') || type.includes('legging')) subCategory = 'Bottomwear';
        else if (type.includes('dress') || type.includes('kurta') || type.includes('suit')) subCategory = 'Full Outfits';
        else if (type.includes('jacket') || type.includes('coat') || type.includes('blazer')) subCategory = 'Outerwear';
        else subCategory = 'Other Clothing';
    }

    return { department, category, subCategory };
}

async function main() {
    const scrapedDir = path.join(process.cwd(), 'scraped');
    if (!fs.existsSync(scrapedDir)) {
        console.error('Scraped directory not found');
        return;
    }

    const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(scrapedDir, file);
        console.log(`Processing ${file}...`);

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // Handle both array and object wrapper structures
        let products = Array.isArray(content) ? content : content.products;
        const isWrapped = !Array.isArray(content);

        if (!products || products.length === 0) continue;

        let updatedCount = 0;
        products = products.map((p: any) => {
            const normalized = normalizeProduct(p);
            updatedCount++;
            return {
                ...p,
                department: normalized.department,
                category: normalized.category,
                subCategory: normalized.subCategory
            };
        });

        // Write back
        const newContent = isWrapped ? { ...content, products } : products;
        fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2), 'utf-8');
        console.log(`✅ Updated ${updatedCount} products in ${file}`);
    }
}

main();
