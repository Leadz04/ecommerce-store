import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product from '../src/models/Product';
// import connectDB from '../src/lib/mongodb'; // Removed to avoid init side-effects

const scrapedDir = path.join(process.cwd(), 'scraped');

async function importProducts() {
    console.log('🚀 Starting Import of Scraped Products to MongoDB...');

    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }

    const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));
    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const file of files) {
        console.log(`\n📂 Processing ${file}...`);
        const content = JSON.parse(fs.readFileSync(path.join(scrapedDir, file), 'utf-8'));
        const products = Array.isArray(content) ? content : content.products;

        if (!Array.isArray(products)) {
            console.log(`⚠️  Skipping ${file}: Invalid format`);
            continue;
        }

        console.log(`   Found ${products.length} products. Importing...`);
        let batchCount = 0;
        const batchSize = 100;

        for (const p of products) {
            // 1. Prepare Product Data
            const productData = {
                name: p.name,
                description: p.description || p.name,
                descriptionHtml: p.descriptionHtml,
                price: p.price,
                originalPrice: p.originalPrice,
                image: p.image,
                images: p.images || [p.image],
                category: p.category, // Now a string, not enum
                department: p.department || p.category, // Fallback
                subCategory: p.subCategory || p.category, // Fallback
                brand: p.brand,
                sourceUrl: p.sourceUrl,
                productType: p.productType,
                tags: p.tags || [],
                specifications: p.specifications ? new Map(Object.entries(p.specifications)) : undefined,
                inStock: p.inStock !== false, // Default to true if missing
                stockCount: p.stockCount || 0,
                status: 'draft', // Keep as draft initially? Or published? Let's say published for visibility.
                isActive: true
            };

            // 2. UPSERT using sourceUrl
            try {
                // @ts-ignore
                const result = await (Product as any).updateOne(
                    { sourceUrl: p.sourceUrl }, // Filter
                    { $set: productData },      // Update
                    { upsert: true }            // Create if new
                );

                if (result.upsertedCount > 0) totalImported++;
                else if (result.modifiedCount > 0) totalUpdated++;
                else totalSkipped++;

                batchCount++;
                if (batchCount % batchSize === 0) {
                    process.stdout.write(`.`);
                }

            } catch (err: any) {
                console.error(`\n❌ Error importing ${p.name}:`, err.message);
            }
        }
        console.log(` Done.`);
    }

    console.log('\n-----------------------------------');
    console.log(`🎉 Import Complete!`);
    console.log(`   Added:   ${totalImported}`);
    console.log(`   Updated: ${totalUpdated}`);
    console.log(`   Skipped: ${totalSkipped} (Unchanged)`);
    console.log('-----------------------------------');

    process.exit(0);
}

// Connect and Run
importProducts();
