const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  process.exit(1);
}

const collectionsToDelete = [
  'keywords',
  'userreminderpreferences',
  'giftcards',
  'trends',
  'occasions',
  'abandonedcarts',
  'shophealths',
  'productrecommendations',
  'competitors',
  'reminders',
  'flashsales',
  'loyaltyaccounts',
  'discounts'
];

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function deleteCollections() {
  try {
    console.log('🔄 Connecting to database...');
    const conn = await mongoose.connect(MONGODB_URI);
    const db = conn.connection.db;
    
    console.log('✅ Connected to database:', db.databaseName);
    console.log('\n⚠️  WARNING: This will permanently delete the following collections:');
    collectionsToDelete.forEach(col => console.log(`   - ${col}`));
    console.log('\n');
    
    // Get collection stats before deletion
    console.log('📊 Analyzing collections...\n');
    const stats = {};
    
    for (const collectionName of collectionsToDelete) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        const collStats = await db.command({ collStats: collectionName });
        
        stats[collectionName] = {
          count,
          size: collStats.size || 0,
          storageSize: collStats.storageSize || 0,
          indexSize: collStats.totalIndexSize || 0,
          exists: true
        };
      } catch (error) {
        if (error.codeName === 'NamespaceNotFound') {
          stats[collectionName] = { exists: false };
        } else {
          console.error(`⚠️  Error getting stats for ${collectionName}:`, error.message);
          stats[collectionName] = { exists: false, error: error.message };
        }
      }
    }
    
    console.log('📊 Collection Statistics:');
    console.log('='.repeat(80));
    let totalSize = 0;
    let totalIndexSize = 0;
    
    for (const [name, stat] of Object.entries(stats)) {
      if (!stat.exists) {
        console.log(`${name}: ❌ Collection does not exist`);
        continue;
      }
      
      const total = stat.storageSize + stat.indexSize;
      totalSize += stat.storageSize;
      totalIndexSize += stat.indexSize;
      
      console.log(`\n${name}:`);
      console.log(`  Documents: ${stat.count.toLocaleString()}`);
      console.log(`  Data Size: ${formatBytes(stat.size)}`);
      console.log(`  Storage Size: ${formatBytes(stat.storageSize)}`);
      console.log(`  Index Size: ${formatBytes(stat.indexSize)}`);
      console.log(`  Total Size: ${formatBytes(total)}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Total Storage to Recover: ${formatBytes(totalSize)}`);
    console.log(`Total Index Size to Recover: ${formatBytes(totalIndexSize)}`);
    console.log(`Grand Total: ${formatBytes(totalSize + totalIndexSize)}`);
    console.log('='.repeat(80));
    
    // Separate collections with data vs empty
    const withData = [];
    const empty = [];
    
    for (const [name, stat] of Object.entries(stats)) {
      if (!stat.exists) continue;
      if (stat.count > 0) {
        withData.push({ name, count: stat.count });
      } else {
        empty.push(name);
      }
    }
    
    if (withData.length > 0) {
      console.log('\n⚠️  Collections with data (will be skipped for safety):');
      withData.forEach(({ name, count }) => {
        console.log(`   - ${name} (${count} documents)`);
      });
      console.log('\n   To delete collections with data, use MongoDB shell:');
      withData.forEach(({ name }) => {
        console.log(`   db.${name}.drop()`);
      });
    }
    
    if (empty.length > 0) {
      console.log('\n✅ Collections to delete (empty):');
      empty.forEach(name => console.log(`   - ${name}`));
    }
    
    console.log('\n🗑️  Starting deletion of empty collections...\n');
    
    const results = {};
    let deletedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const collectionName of collectionsToDelete) {
      const stat = stats[collectionName];
      
      if (!stat || !stat.exists) {
        console.log(`⏭️  ${collectionName} - Collection does not exist, skipping`);
        results[collectionName] = { deleted: false, reason: 'Does not exist' };
        skippedCount++;
        continue;
      }
      
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`⚠️  ${collectionName} - Has ${count} documents, skipping for safety`);
          results[collectionName] = { deleted: false, reason: `Has ${count} documents` };
          skippedCount++;
        } else {
          await collection.drop();
          console.log(`✅ ${collectionName} - DELETED`);
          results[collectionName] = { deleted: true };
          deletedCount++;
        }
      } catch (error) {
        console.error(`❌ ${collectionName} - Error:`, error.message);
        results[collectionName] = { deleted: false, error: error.message };
        errorCount++;
      }
    }
    
    console.log('\n\n📊 Deletion Summary:');
    console.log('='.repeat(80));
    console.log(`✅ Deleted: ${deletedCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\nDetails:');
    console.log('-'.repeat(80));
    
    for (const [collection, result] of Object.entries(results)) {
      if (result.deleted) {
        console.log(`✅ ${collection} - DELETED`);
      } else {
        const reason = result.reason || result.error || 'Unknown';
        console.log(`⚠️  ${collection} - SKIPPED: ${reason}`);
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Process complete!');
    console.log(`💾 Recovered approximately ${formatBytes(totalSize + totalIndexSize)} of space`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteCollections();

