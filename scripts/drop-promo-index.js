/**
 * Drop the legacy token index from emailpromodiscounts collection.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/drop-promo-index.js
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI. Set it in your environment before running this script.');
  process.exit(1);
}

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
    });

    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to database: ${dbName}`);

    const collection = mongoose.connection.db.collection('emailpromodiscounts');

    const indexName = 'token_1';
    console.log(`🔎 Checking for index "${indexName}"...`);

    const indexes = await collection.indexes();
    const hasIndex = indexes.some((idx) => idx.name === indexName);

    if (!hasIndex) {
      console.log(`ℹ️ Index "${indexName}" does not exist. Nothing to drop.`);
      return;
    }

    console.log(`🧹 Dropping index "${indexName}"...`);
    await collection.dropIndex(indexName);
    console.log('✅ Index dropped successfully.');
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('ℹ️ Index was already removed.');
      return;
    }
    console.error('❌ Failed to drop index:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB.');
  }
}

run();

