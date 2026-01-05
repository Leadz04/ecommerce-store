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

if (!MONGODB_URI) {
  const msg = 'MONGODB_URI is not defined! Please set it in your environment variables';
  if (isBuildTime) {
    console.warn('⚠️  [MongoDB] ' + msg + ' (skipping during build)');
  } else {
    throw new Error(msg);
  }
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
  if (isBuildTime) {
    console.warn('⚠️  [MongoDB] Skipping connection (build time)');
    return null as any;
  }

  // Return existing connection
  if (cached.conn) {
    console.log('✅ [MongoDB] Using cached connection');
    return cached.conn;
  }

  // Basic retry with short backoff to reduce transient failures
  const connectWithRetry = async (attempt = 1): Promise<typeof mongoose> => {
    const maxAttempts = 3;
    const backoffMs = attempt * 500;

    try {
      console.log(`🔄 [MongoDB] Connecting (attempt ${attempt}/${maxAttempts})...`);
      console.log('[MongoDB] Connection URI prefix:', MONGODB_URI.substring(0, 30) + '...');

      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 20000,
        heartbeatFrequencyMS: 10000,
      } as const;

      return await mongoose.connect(MONGODB_URI, opts);
    } catch (err) {
      console.error(`❌ [MongoDB] Connection attempt ${attempt} failed:`, (err as any)?.message || err);
      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, backoffMs));
        return connectWithRetry(attempt + 1);
      }
      throw err;
    }
  };

  if (!cached.promise) {
    cached.promise = connectWithRetry()
      .then((mongooseInstance) => {
        console.log('✅ [MongoDB] Connected successfully!');
        console.log('[MongoDB] Database:', mongooseInstance.connection.db.databaseName);
        console.log('[MongoDB] Host:', mongooseInstance.connection.host);
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('❌ [MongoDB] Connection failed!');
        console.error('[MongoDB] Error message:', (err as any)?.message || err);
        // Log common fields if present
        if ((err as any)?.code) console.error('[MongoDB] Error code:', (err as any).code);
        if ((err as any)?.name) console.error('[MongoDB] Error name:', (err as any).name);
        if ((err as any)?.reason) console.error('[MongoDB] Error reason:', (err as any).reason);
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
