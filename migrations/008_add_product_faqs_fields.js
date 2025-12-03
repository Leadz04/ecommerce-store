const mongoose = require('mongoose');

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

module.exports = {
  version: '008',
  name: 'add_product_faqs_fields',
  description: 'Add generatedFAQs, relatedSearches, and peopleAlsoSearchFor fields to Product model',
  
  async up() {
    console.log('  📝 Adding FAQ-related fields to Product model...');
    
    await connectDB();
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Add generatedFAQs field (array of FAQ objects)
    console.log('  ➕ Adding generatedFAQs field...');
    await productsCollection.updateMany(
      { generatedFAQs: { $exists: false } },
      { $set: { generatedFAQs: [] } }
    );
    
    // Add relatedSearches field (array of strings)
    console.log('  ➕ Adding relatedSearches field...');
    await productsCollection.updateMany(
      { relatedSearches: { $exists: false } },
      { $set: { relatedSearches: [] } }
    );
    
    // Add peopleAlsoSearchFor field (array of objects)
    console.log('  ➕ Adding peopleAlsoSearchFor field...');
    await productsCollection.updateMany(
      { peopleAlsoSearchFor: { $exists: false } },
      { $set: { peopleAlsoSearchFor: [] } }
    );
    
    // Create index on generatedFAQs.generatedAt for faster cache lookups
    console.log('  📊 Creating index on generatedFAQs.generatedAt...');
    try {
      await productsCollection.createIndex(
        { 'generatedFAQs.generatedAt': 1 },
        { name: 'generatedFAQs_generatedAt_idx', sparse: true }
      );
    } catch (error) {
      // Index might already exist, that's okay
      if (!error.message.includes('already exists')) {
        console.warn('  ⚠️  Could not create index:', error.message);
      }
    }
    
    const count = await productsCollection.countDocuments({});
    console.log(`  ✅ Migration completed. Updated ${count} products.`);
  },
  
  async down() {
    console.log('  🔄 Rolling back FAQ fields migration...');
    
    await connectDB();
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Remove the fields
    console.log('  ➖ Removing generatedFAQs field...');
    await productsCollection.updateMany(
      {},
      { $unset: { generatedFAQs: 1 } }
    );
    
    console.log('  ➖ Removing relatedSearches field...');
    await productsCollection.updateMany(
      {},
      { $unset: { relatedSearches: 1 } }
    );
    
    console.log('  ➖ Removing peopleAlsoSearchFor field...');
    await productsCollection.updateMany(
      {},
      { $unset: { peopleAlsoSearchFor: 1 } }
    );
    
    // Drop index
    console.log('  ➖ Dropping index...');
    try {
      await productsCollection.dropIndex('generatedFAQs_generatedAt_idx');
    } catch (error) {
      // Index might not exist, that's okay
      console.warn('  ⚠️  Could not drop index:', error.message);
    }
    
    console.log('  ✅ Rollback completed.');
  }
};

