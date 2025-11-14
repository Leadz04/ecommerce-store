import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Allow build to proceed without MongoDB connection
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// Enhanced logging for debugging
console.log('[MongoDB] Environment check:', {
  hasMongoURI: !!MONGODB_URI,
  isBuildTime,
  nodeEnv: process.env.NODE_ENV,
  mongoURIPrefix: MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'NOT SET'
});

if (!MONGODB_URI && !isBuildTime) {
  console.error('❌ [MongoDB] MONGODB_URI is not defined! Database operations will fail.');
  console.error('[MongoDB] Please set MONGODB_URI in your environment variables');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // Skip connection during build phase
  if (isBuildTime || !MONGODB_URI) {
    console.warn('⚠️  [MongoDB] Skipping connection (build time or no URI)');
    return null as any;
  }

  // Return existing connection
  if (cached.conn) {
    console.log('✅ [MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 [MongoDB] Initiating new connection...');
    console.log('[MongoDB] Connection URI prefix:', MONGODB_URI.substring(0, 30) + '...');
    
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail fast
      socketTimeoutMS: 10000,
    } as const;

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ [MongoDB] Connected successfully!');
        console.log('[MongoDB] Database:', mongoose.connection.db.databaseName);
        console.log('[MongoDB] Host:', mongoose.connection.host);
        return mongoose;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('❌ [MongoDB] Connection failed!');
        console.error('[MongoDB] Error message:', err.message);
        console.error('[MongoDB] Error code:', err.code);
        console.error('[MongoDB] Error name:', err.name);
        if (err.reason) {
          console.error('[MongoDB] Error reason:', err.reason);
        }
        throw err;
      });
  }

  try {
    console.log('⏳ [MongoDB] Waiting for connection...');
    cached.conn = await cached.promise;
    console.log('✅ [MongoDB] Connection established and cached');
  } catch (e) {
    cached.promise = null;
    console.error('❌ [MongoDB] Failed to establish connection');
    throw e;
  }

  return cached.conn;
}

export default connectDB;
