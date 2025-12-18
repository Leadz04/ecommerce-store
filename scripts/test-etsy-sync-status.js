/**
 * Test script for Etsy Sync Status functionality
 * 
 * Usage:
 *   node scripts/test-etsy-sync-status.js [shopId]
 * 
 * Example:
 *   node scripts/test-etsy-sync-status.js 12345678
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models (adjust path as needed)
const { EtsyListing, Product } = require('../src/models');

async function testSyncStatus() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const shopId = process.argv[2] || null;
    if (shopId) {
      console.log(`📦 Testing with shopId: ${shopId}\n`);
    } else {
      console.log('📦 Testing with all shops\n');
    }

    // Test 1: Count total listings
    console.log('=== Test 1: Count Listings ===');
    const listingQuery = shopId ? { shopId } : {};
    const totalListings = await EtsyListing.countDocuments(listingQuery);
    const listingsWithProduct = await EtsyListing.countDocuments({
      ...listingQuery,
      productId: { $exists: true, $ne: null },
    });
    console.log(`   Total listings: ${totalListings}`);
    console.log(`   Listings with productId: ${listingsWithProduct}\n`);

    // Test 2: Get distinct productIds
    console.log('=== Test 2: Get Synced Product IDs ===');
    const productQuery = {
      ...listingQuery,
      productId: { $exists: true, $ne: null },
    };
    const syncedProductIds = await EtsyListing.distinct('productId', productQuery);
    console.log(`   Found ${syncedProductIds.length} unique synced products`);
    if (syncedProductIds.length > 0) {
      console.log(`   First 5 productIds:`, syncedProductIds.slice(0, 5));
    }
    console.log('');

    // Test 3: Check if specific product is synced
    if (syncedProductIds.length > 0) {
      console.log('=== Test 3: Check Single Product ===');
      const testProductId = syncedProductIds[0];
      const isSynced = await EtsyListing.countDocuments({
        productId: testProductId,
        ...(shopId ? { shopId } : {}),
      }) > 0;
      console.log(`   Product ${testProductId} is synced: ${isSynced}`);
      
      const listings = await EtsyListing.find({
        productId: testProductId,
        ...(shopId ? { shopId } : {}),
      }).select('etsyListingId shopId state').lean();
      console.log(`   Found ${listings.length} listing(s) for this product`);
      if (listings.length > 0) {
        console.log(`   Listing details:`, JSON.stringify(listings[0], null, 2));
      }
      console.log('');
    }

    // Test 4: Batch check multiple products
    if (syncedProductIds.length > 0) {
      console.log('=== Test 4: Batch Check Products ===');
      const testIds = syncedProductIds.slice(0, 5);
      const batchQuery = {
        productId: { $in: testIds },
        ...(shopId ? { shopId } : {}),
      };
      const syncedInBatch = await EtsyListing.distinct('productId', batchQuery);
      console.log(`   Checked ${testIds.length} products`);
      console.log(`   Synced: ${syncedInBatch.length}`);
      console.log(`   Synced IDs:`, syncedInBatch);
      console.log('');
    }

    // Test 5: Get statistics by state
    console.log('=== Test 5: Statistics by State ===');
    const statsByState = await EtsyListing.aggregate([
      { $match: { ...productQuery } },
      {
        $group: {
          _id: '$state',
          count: { $addToSet: '$productId' },
        },
      },
      {
        $project: {
          state: '$_id',
          uniqueProducts: { $size: '$count' },
        },
      },
    ]);
    console.log('   By State:');
    statsByState.forEach(stat => {
      console.log(`     ${stat.state || 'null'}: ${stat.uniqueProducts} products`);
    });
    console.log('');

    // Test 6: Check indexes
    console.log('=== Test 6: Verify Indexes ===');
    const indexes = await EtsyListing.collection.getIndexes();
    const hasProductIdIndex = 'productId_1' in indexes;
    const hasCompoundIndex = 'productId_1_shopId_1' in indexes;
    const hasStateIndex = 'state_1_productId_1' in indexes;
    
    console.log(`   productId index: ${hasProductIdIndex ? '✅' : '❌'}`);
    console.log(`   productId + shopId index: ${hasCompoundIndex ? '✅' : '❌'}`);
    console.log(`   state + productId index: ${hasStateIndex ? '✅' : '❌'}`);
    
    if (!hasProductIdIndex || !hasCompoundIndex || !hasStateIndex) {
      console.log('\n   ⚠️  Some indexes are missing. They will be created on next app restart.');
      console.log('   Or create manually:');
      console.log('   db.etsylistings.createIndex({ productId: 1 });');
      console.log('   db.etsylistings.createIndex({ productId: 1, shopId: 1 });');
      console.log('   db.etsylistings.createIndex({ state: 1, productId: 1 });');
    }
    console.log('');

    // Test 7: Performance test
    if (syncedProductIds.length > 0) {
      console.log('=== Test 7: Performance Test ===');
      const testIds = syncedProductIds.slice(0, 100);
      
      const startTime = Date.now();
      const result = await EtsyListing.find({
        productId: { $in: testIds },
        ...(shopId ? { shopId } : {}),
      }).select('productId').lean();
      const endTime = Date.now();
      
      const uniqueProducts = new Set(result.map(r => r.productId));
      console.log(`   Query time: ${endTime - startTime}ms`);
      console.log(`   Checked ${testIds.length} productIds`);
      console.log(`   Found ${uniqueProducts.size} synced products`);
      console.log(`   Performance: ${((endTime - startTime) / testIds.length).toFixed(2)}ms per product`);
      console.log('');
    }

    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run tests
testSyncStatus();
