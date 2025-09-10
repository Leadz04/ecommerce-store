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
  version: '003',
  name: 'add_product_categories',
  description: 'Add category field to products and create category indexes',
  
  async up() {
    console.log('  📝 Adding product categories...');
    
    await connectDB();
    
    // Add category field to existing products if they don't have it
    await mongoose.connection.db.collection('products').updateMany(
      { category: { $exists: false } },
      { $set: { category: 'Uncategorized' } }
    );
    
    // Create category index for better filtering
    await mongoose.connection.db.collection('products').createIndex({ category: 1 });
    
    console.log('  ✅ Product categories added');
  },
  
  async down() {
    console.log('  🔄 Rolling back product categories...');
    
    await connectDB();
    
    // Remove category field from products
    await mongoose.connection.db.collection('products').updateMany(
      {},
      { $unset: { category: 1 } }
    );
    
    // Drop category index
    await mongoose.connection.db.collection('products').dropIndex({ category: 1 });
    
    console.log('  ✅ Product categories rolled back');
  }
};
