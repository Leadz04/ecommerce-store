import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Allow build to proceed without MongoDB connection
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

if (!MONGODB_URI && !isBuildTime) {
  console.warn('⚠️  MONGODB_URI is not defined. Database operations will fail.');
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
    console.warn('⚠️  Skipping MongoDB connection (build time or no URI)');
    return null as any;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail fast
      socketTimeoutMS: 10000,
    } as const;

    cached.promise = mongoose.connect(MONGODB_URI, opts).catch((err) => {
      cached.promise = null;
      console.error('MongoDB connection error:', err.message);
      throw err;
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

export default connectDB;
