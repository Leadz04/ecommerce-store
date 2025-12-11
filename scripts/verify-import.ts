import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import Product from '../src/models/Product';
// import connectDB from '../src/lib/mongodb';

// Bypass TS strictness for script
const ProductModel = Product as any;

async function verify() {
    console.log('📊 Verifying Database Content...');
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);

    const scrapedCount = await ProductModel.countDocuments({ sourceUrl: { $exists: true, $ne: null } });
    console.log(`\n✅ Total Scraped Products in DB: ${scrapedCount}`);

    console.log('\n--- Breakdown by Brand ---');
    const brands = await ProductModel.aggregate([
        { $match: { sourceUrl: { $exists: true, $ne: null } } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    brands.forEach((b: any) => console.log(`   ${b._id}: ${b.count}`));

    console.log('\n--- Breakdown by Department ---');
    const depts = await ProductModel.aggregate([
        { $match: { sourceUrl: { $exists: true, $ne: null } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    depts.forEach((d: any) => console.log(`   ${d._id}: ${d.count}`));

    // Check 999pk images specifically
    const ninePkMulti = await ProductModel.countDocuments({
        brand: '999pk',
        sourceUrl: { $exists: true },
        $where: "this.images.length > 1"
    });
    const ninePkTotal = await ProductModel.countDocuments({ brand: '999pk', sourceUrl: { $exists: true } });

    // Note: $where is slow, but fine for script. 
    // Actually safer to use $expr
    const ninePkMultiEfficient = await ProductModel.countDocuments({
        brand: '999pk',
        sourceUrl: { $exists: true },
        $expr: { $gt: [{ $size: "$images" }, 1] }
    });

    console.log(`\n--- 999pk Image Quality ---`);
    console.log(`   Total 999pk: ${ninePkTotal}`);
    console.log(`   With Multiple Images: ${ninePkMultiEfficient} (${ninePkTotal > 0 ? Math.round(ninePkMultiEfficient / ninePkTotal * 100) : 0}%)`);

    process.exit(0);
}

verify();
