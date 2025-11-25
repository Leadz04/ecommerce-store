/**
 * Bulk-update every product's brand to "EverStyleCrafts".
 *
 * Usage:
 *   node scripts/update-product-brands.js
 *
 * Make sure MONGODB_URI (or .env.local) is configured before running.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Prefer .env.local if it exists, fall back to default dotenv behavior.
try {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
  } else {
    require('dotenv').config();
  }
} catch (error) {
  console.warn('⚠️  dotenv not found; relying on existing environment variables.');
}

const MONGO_URI = process.env.MONGODB_URI;
const TARGET_BRAND = 'EverStyleCrafts';

if (!MONGO_URI) {
  console.error('❌ Missing MONGODB_URI. Aborting.');
  process.exit(1);
}

// Minimal schema definition for the update operation.
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    brand: { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'products', timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');

    const totalProducts = await Product.estimatedDocumentCount();
    console.log(`📦 Total products: ${totalProducts}`);

    // Only touch products that are missing the target brand already.
    const filter = { brand: { $ne: TARGET_BRAND } };
    const { matchedCount, modifiedCount } = await Product.updateMany(filter, {
      $set: { brand: TARGET_BRAND },
    });

    console.log('🔄 Brand update complete:');
    console.log(`   • Records matched:  ${matchedCount}`);
    console.log(`   • Records modified: ${modifiedCount}`);

    const remaining = await Product.countDocuments(filter);
    console.log(`✅ Verification: ${remaining} product(s) still off-brand.`);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    console.log('🔌 MongoDB connection closed');
  }
}

run();


