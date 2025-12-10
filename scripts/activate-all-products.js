/**
 * Activates and publishes all products in the Stage3 database.
 * Usage: MONGODB_URI_STAGE3="mongodb+srv://..." node scripts/activate-all-products.js
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env.local'),
});
require('dotenv').config(); // fallback to .env

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set.');
  console.error('Please ensure MONGODB_URI is set in your .env.local file.');
  process.exit(1);
}

console.log('Connecting to MongoDB Main database...');
console.log('URI prefix:', MONGODB_URI.substring(0, 30) + '...');

/**
 * Extract database name from MongoDB URI
 */
function extractDatabaseName(uri) {
  try {
    const url = new URL(uri);
    // Database name is the pathname without the leading slash
    const dbName = url.pathname.substring(1).split('?')[0];
    return dbName || null;
  } catch (e) {
    // If URI parsing fails, try regex
    const match = uri.match(/\/([^\/\?]+)(\?|$)/);
    return match ? match[1] : null;
  }
}

async function run() {
  let conn;
  let db;
  try {
    // Connect to MongoDB Main database
    conn = await mongoose.createConnection(MONGODB_URI);

    // Get the database name from URI
    const dbName = extractDatabaseName(MONGODB_URI);
    db = dbName ? conn.useDb(dbName, { useCache: true }) : conn;

    console.log(`✅ Connected successfully to Main database: ${db.name}`);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.error('\nDNS resolution failed. Please check:');
      console.error('1. Your internet connection');
      console.error('2. The MongoDB URI is correct in .env.local');
      console.error('3. The cluster hostname is correct');
    }
    throw error;
  }

  // Create Product model using the Stage3 database connection
  const Product = db.model(
    'Product',
    new mongoose.Schema(
      {
        status: String,
        isActive: Boolean,
      },
      { strict: false }
    )
  );

  console.log('Connected. Analyzing products...');

  // Check current state of products
  const totalProducts = await Product.countDocuments({});
  const alreadyActiveAndPublished = await Product.countDocuments({
    isActive: true,
    status: 'published'
  });
  const inactiveProducts = await Product.countDocuments({ isActive: false });
  const notPublishedProducts = await Product.countDocuments({
    $or: [
      { status: { $ne: 'published' } },
      { status: { $exists: false } }
    ]
  });

  console.log(`\n📊 Current State:`);
  console.log(`   Total products: ${totalProducts}`);
  console.log(`   Already active & published: ${alreadyActiveAndPublished}`);
  console.log(`   Inactive products: ${inactiveProducts}`);
  console.log(`   Not published products: ${notPublishedProducts}`);

  console.log('\n🔄 Activating and publishing all products...');
  const result = await Product.updateMany(
    {},
    { $set: { isActive: true, status: 'published' } }
  );

  console.log(`\n✅ Update Results:`);
  console.log(`   Matched: ${result.matchedCount}`);
  console.log(`   Modified: ${result.modifiedCount}`);

  const notModified = result.matchedCount - result.modifiedCount;
  if (notModified > 0) {
    console.log(`   Not modified: ${notModified} (already had isActive=true and status='published')`);
  }

  await conn.close();
  console.log('\n✅ Done.');
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

