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

// Migration Schema
const MigrationSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  executedBy: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  rollbackVersion: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = {
  version: '002',
  name: 'add_migration_tracking',
  description: 'Add migration tracking system to the database',
  
  async up() {
    console.log('  📝 Adding migration tracking system...');
    
    await connectDB();
    
    // Create migration collection and indexes
    const Migration = mongoose.models.Migration || mongoose.model('Migration', MigrationSchema);
    await Migration.collection.createIndex({ version: 1 }, { unique: true });
    await Migration.collection.createIndex({ appliedAt: -1 });
    await Migration.collection.createIndex({ status: 1 });
    
    console.log('  ✅ Migration tracking system added');
  },
  
  async down() {
    console.log('  🔄 Rolling back migration tracking...');
    
    await connectDB();
    
    // Drop migration collection
    await mongoose.connection.db.collection('migrations').drop();
    
    console.log('  ✅ Migration tracking rolled back');
  }
};
