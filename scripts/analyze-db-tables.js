const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get collection statistics
async function getCollectionStats(db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    const stats = await db.command({ collStats: collectionName });
    const count = await collection.countDocuments();
    const indexes = await collection.indexes();
    
    return {
      name: collectionName,
      count: count,
      size: stats.size || 0,
      storageSize: stats.storageSize || 0,
      totalIndexSize: stats.totalIndexSize || 0,
      averageObjectSize: stats.avgObjSize || 0,
      indexes: indexes.length,
      indexDetails: indexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        size: idx.size || 0
      }))
    };
  } catch (error) {
    console.error(`Error getting stats for ${collectionName}:`, error.message);
    return {
      name: collectionName,
      error: error.message
    };
  }
}

// List of all model collections (based on models/index.ts)
const modelCollections = [
  'users',
  'roles',
  'products',
  'orders',
  'ordercounters',
  'auditlogs',
  'productversions',
  'analyticevents',
  'searchevents',
  'etsyshops',
  'etsylistings',
  'etsyorders',
  'seoqueries',
  'seokeywords',
  'seoproducts',
  'blogs',
  'keywordresearches',
  'reviews',
  'emailsubscribers',
  'emailtrackings',
  'emailpromodiscounts',
  'productquestions',
  'cartabandonments',
  'savedpaymentmethods',
  'supporttickets',
  'knowledgebases',
  'chatmessages',
  'chatconversations',
  'referrals',
  'productbundles',
  'subscriptions',
  'preorders',
  'stocknotifications',
  'pricealerts',
  'customeranalytics',
  'purchaseanalytics',
  'abandonedcartanalytics',
  'coupons'
];

async function analyzeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;
    const dbName = db.databaseName;
    
    console.log(`✅ Connected to database: ${dbName}\n`);
    console.log('='.repeat(80));
    console.log('DATABASE TABLE SPACE ANALYSIS');
    console.log('='.repeat(80));
    console.log(`Database: ${dbName}`);
    console.log(`Host: ${mongooseInstance.connection.host}`);
    console.log(`Connection Time: ${new Date().toISOString()}\n`);

    // Get all collections in the database
    const allCollections = await db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);
    
    console.log(`Found ${collectionNames.length} collections in database\n`);

    // Get database-level stats
    const dbStats = await db.stats();
    console.log('📊 DATABASE-LEVEL STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Total Data Size:        ${formatBytes(dbStats.dataSize)}`);
    console.log(`Total Storage Size:      ${formatBytes(dbStats.storageSize)}`);
    console.log(`Total Index Size:        ${formatBytes(dbStats.indexSize)}`);
    console.log(`Total Size:              ${formatBytes(dbStats.dataSize + dbStats.indexSize)}`);
    console.log(`Collections Count:      ${dbStats.collections}`);
    console.log(`Objects Count:           ${dbStats.objects}`);
    console.log(`Average Object Size:     ${formatBytes(dbStats.avgObjSize)}`);
    console.log(`Indexes Count:           ${dbStats.indexes}\n`);

    // Analyze each collection
    console.log('📋 COLLECTION-LEVEL DETAILED ANALYSIS');
    console.log('='.repeat(80));
    
    const collectionStats = [];
    
    for (const collectionName of collectionNames) {
      const stats = await getCollectionStats(db, collectionName);
      collectionStats.push(stats);
    }

    // Sort by storage size (descending)
    collectionStats.sort((a, b) => (b.storageSize || 0) - (a.storageSize || 0));

    // Detailed report for each collection
    for (const stats of collectionStats) {
      if (stats.error) {
        console.log(`\n❌ ${stats.name.toUpperCase()}`);
        console.log(`   Error: ${stats.error}`);
        continue;
      }

      console.log(`\n📦 ${stats.name.toUpperCase()}`);
      console.log('-'.repeat(80));
      console.log(`Document Count:         ${stats.count.toLocaleString()}`);
      console.log(`Data Size:             ${formatBytes(stats.size)}`);
      console.log(`Storage Size:          ${formatBytes(stats.storageSize)}`);
      console.log(`Index Size:            ${formatBytes(stats.totalIndexSize)}`);
      console.log(`Total Size:            ${formatBytes(stats.storageSize + stats.totalIndexSize)}`);
      console.log(`Average Object Size:   ${formatBytes(stats.averageObjectSize)}`);
      console.log(`Indexes Count:         ${stats.indexes}`);
      
      if (stats.count > 0) {
        const avgDocSize = stats.size / stats.count;
        console.log(`Avg Document Size:     ${formatBytes(avgDocSize)}`);
      }

      // Index details
      if (stats.indexDetails && stats.indexDetails.length > 0) {
        console.log(`\n   Indexes:`);
        for (const idx of stats.indexDetails) {
          const keysStr = Object.keys(idx.keys).map(k => `${k}:${idx.keys[k]}`).join(', ');
          console.log(`   - ${idx.name} (${keysStr}) - ${formatBytes(idx.size)}`);
        }
      }
    }

    // Summary table
    console.log('\n\n📊 SUMMARY TABLE (Sorted by Storage Size)');
    console.log('='.repeat(80));
    console.log(
      'Collection Name'.padEnd(30) +
      'Documents'.padStart(12) +
      'Data Size'.padStart(15) +
      'Storage Size'.padStart(15) +
      'Index Size'.padStart(15) +
      'Total Size'.padStart(15) +
      'Indexes'.padStart(10)
    );
    console.log('-'.repeat(80));

    for (const stats of collectionStats) {
      if (stats.error) continue;
      
      const name = stats.name.length > 28 ? stats.name.substring(0, 25) + '...' : stats.name;
      const count = stats.count.toLocaleString().padStart(12);
      const dataSize = formatBytes(stats.size).padStart(15);
      const storageSize = formatBytes(stats.storageSize).padStart(15);
      const indexSize = formatBytes(stats.totalIndexSize).padStart(15);
      const totalSize = formatBytes(stats.storageSize + stats.totalIndexSize).padStart(15);
      const indexes = stats.indexes.toString().padStart(10);

      console.log(
        name.padEnd(30) +
        count +
        dataSize +
        storageSize +
        indexSize +
        totalSize +
        indexes
      );
    }

    // Model collections that don't exist
    console.log('\n\n📝 MODEL COLLECTIONS STATUS');
    console.log('='.repeat(80));
    const existingCollections = collectionNames.map(n => n.toLowerCase());
    const missingCollections = modelCollections.filter(
      model => !existingCollections.includes(model.toLowerCase())
    );
    
    if (missingCollections.length > 0) {
      console.log('⚠️  Collections defined in models but not found in database:');
      missingCollections.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('✅ All model collections exist in database');
    }

    // Extra collections (not in models)
    const modelCollectionNames = modelCollections.map(m => m.toLowerCase());
    const extraCollections = collectionNames.filter(
      name => !modelCollectionNames.includes(name.toLowerCase())
    );
    
    if (extraCollections.length > 0) {
      console.log('\n📌 Extra collections found in database (not in models):');
      extraCollections.forEach(col => console.log(`   - ${col}`));
    }

    // Space usage breakdown
    console.log('\n\n💾 SPACE USAGE BREAKDOWN');
    console.log('='.repeat(80));
    const totalDataSize = collectionStats.reduce((sum, s) => sum + (s.size || 0), 0);
    const totalStorageSize = collectionStats.reduce((sum, s) => sum + (s.storageSize || 0), 0);
    const totalIndexSize = collectionStats.reduce((sum, s) => sum + (s.totalIndexSize || 0), 0);
    
    console.log(`Total Data Size:        ${formatBytes(totalDataSize)}`);
    console.log(`Total Storage Size:     ${formatBytes(totalStorageSize)}`);
    console.log(`Total Index Size:       ${formatBytes(totalIndexSize)}`);
    console.log(`Grand Total:            ${formatBytes(totalStorageSize + totalIndexSize)}`);
    
    // Top 10 largest collections
    console.log('\n\n🏆 TOP 10 LARGEST COLLECTIONS BY STORAGE SIZE');
    console.log('='.repeat(80));
    const top10 = collectionStats.slice(0, 10);
    top10.forEach((stats, index) => {
      if (stats.error) return;
      const totalSize = stats.storageSize + stats.totalIndexSize;
      const percentage = ((totalSize / (totalStorageSize + totalIndexSize)) * 100).toFixed(2);
      console.log(
        `${(index + 1).toString().padStart(2)}. ${stats.name.padEnd(30)} ` +
        `${formatBytes(totalSize).padStart(15)} (${percentage}%)`
      );
    });

    console.log('\n' + '='.repeat(80));
    console.log('Analysis complete!');
    console.log('='.repeat(80));

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed.');

  } catch (error) {
    console.error('❌ Error analyzing database:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeDatabase();

