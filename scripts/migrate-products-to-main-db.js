/**
 * Migration script to move all products from MONGODB_URI_STAGE3 to MONGODB_URI
 * This consolidates products and users into a single database
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env.local'),
});
require('dotenv').config(); // fallback to .env

const MONGODB_URI_STAGE3 = process.env.MONGODB_URI_STAGE3;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI_STAGE3) {
  console.error('Error: MONGODB_URI_STAGE3 is not set.');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set.');
  process.exit(1);
}

// Product Schema
const ProductSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

async function migrate() {
  let stage3Conn, mainConn;
  
  try {
    console.log('🔄 Connecting to databases...');
    
    // Connect to STAGE3 database
    stage3Conn = await mongoose.createConnection(MONGODB_URI_STAGE3);
    const Stage3Product = stage3Conn.model('Product', ProductSchema);
    console.log('✅ Connected to STAGE3 database');
    
    // Connect to main database
    mainConn = await mongoose.createConnection(MONGODB_URI);
    const MainProduct = mainConn.model('Product', ProductSchema);
    console.log('✅ Connected to main database');
    
    // Count products in STAGE3
    const stage3Count = await Stage3Product.countDocuments({});
    console.log(`\n📊 Found ${stage3Count} products in STAGE3 database`);
    
    if (stage3Count === 0) {
      console.log('⚠️  No products to migrate');
      return;
    }
    
    // Count existing products in main DB
    const mainCount = await MainProduct.countDocuments({});
    console.log(`📊 Found ${mainCount} products in main database`);
    
    // Ask for confirmation
    console.log(`\n⚠️  This will copy ${stage3Count} products to main database`);
    console.log('   Existing products in main DB will be preserved');
    console.log('   Duplicates (by _id) will be skipped\n');
    
    // Fetch all products from STAGE3 in batches
    const batchSize = 1000;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('🚀 Starting migration...\n');
    
    for (let skip = 0; skip < stage3Count; skip += batchSize) {
      const products = await Stage3Product.find({})
        .skip(skip)
        .limit(batchSize)
        .lean();
      
      console.log(`Processing batch ${Math.floor(skip / batchSize) + 1} (${products.length} products)...`);
      
      for (const product of products) {
        try {
          // Check if product already exists in main DB
          const exists = await MainProduct.findById(product._id);
          
          if (exists) {
            skipped++;
            continue;
          }
          
          // Insert product into main DB
          await MainProduct.create(product);
          migrated++;
          
          if (migrated % 100 === 0) {
            process.stdout.write(`\r   Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
          }
        } catch (error) {
          errors++;
          console.error(`\n❌ Error migrating product ${product._id}:`, error.message);
        }
      }
    }
    
    console.log('\n\n✅ Migration completed!');
    console.log(`   Migrated: ${migrated} products`);
    console.log(`   Skipped: ${skipped} products (already exist)`);
    console.log(`   Errors: ${errors} products`);
    
    // Final count
    const finalMainCount = await MainProduct.countDocuments({});
    console.log(`\n📊 Final count in main database: ${finalMainCount} products`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    if (stage3Conn) await stage3Conn.close();
    if (mainConn) await mainConn.close();
    console.log('\n✅ Database connections closed');
  }
}

migrate().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

