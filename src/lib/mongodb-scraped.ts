import mongoose from 'mongoose';

const MONGODB_SCRAPED_URI = process.env.MONGODB_SCRAPED_URI || process.env.MONGODB_URI || '';

if (!MONGODB_SCRAPED_URI) {
  throw new Error('Please define the MONGODB_SCRAPED_URI (or MONGODB_URI) env var in .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseScraped: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseScraped ?? { conn: null, promise: null };

if (!global.mongooseScraped) {
  global.mongooseScraped = cached;
}

async function connectScrapedDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = { bufferCommands: false } as const;
    cached.promise = mongoose.createConnection(MONGODB_SCRAPED_URI, opts as any).asPromise() as any;
  }

  try {
    cached.conn = (await cached.promise) as any;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectScrapedDB;

