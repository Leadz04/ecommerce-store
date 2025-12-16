/**
 * Migration script to fix EtsyShop indexes
 * 
 * This script:
 * 1. Drops the old unique index on shopId (if it exists)
 * 2. Ensures the compound unique index on {userId: 1, shopId: 1} exists
 * 
 * Run with: node scripts/fix-etsy-shop-indexes.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fixEtsyShopIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('etsyshops');

    // Get current indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Drop old unique index on shopId if it exists
    try {
      const oldIndex = indexes.find(idx => 
        idx.key.shopId === 1 && 
        Object.keys(idx.key).length === 1 &&
        idx.unique === true
      );
      
      if (oldIndex) {
        console.log(`\nDropping old unique index on shopId: ${oldIndex.name}`);
        await collection.dropIndex(oldIndex.name);
        console.log('✓ Old index dropped');
      } else {
        console.log('\nNo old unique index on shopId found');
      }
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('\nOld index not found (already dropped or never existed)');
      } else {
        throw error;
      }
    }

    // Ensure compound unique index exists
    console.log('\nEnsuring compound unique index {userId: 1, shopId: 1} exists...');
    try {
      await collection.createIndex(
        { userId: 1, shopId: 1 },
        { unique: true, name: 'userId_1_shopId_1' }
      );
      console.log('✓ Compound unique index created/verified');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('✓ Compound unique index already exists');
      } else {
        throw error;
      }
    }

    // Verify final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), idx.unique ? '(unique)' : '');
    });

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixEtsyShopIndexes();
