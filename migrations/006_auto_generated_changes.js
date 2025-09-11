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
  version: '006',
  name: 'auto_generated_changes',
  description: 'Auto-generated migration for schema changes',
  
  async up() {
    console.log('  📝 Applying auto-generated schema changes...');
    
    await connectDB();
    
    // Create new model Occasion
    // Note: Model will be created automatically when first document is inserted

    console.log('  ✅ Auto-generated schema changes applied');
  },

  async down() {
    console.log('  🔄 Rolling back auto-generated schema changes...');
    
    await connectDB();
    
    // Rollback logic would go here
    // Note: This is a basic rollback - you may need to customize it
    
    console.log('  ✅ Auto-generated schema changes rolled back');
  }
};
