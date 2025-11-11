/**
 * Normalize sourced product brand/categoryGroup values for Outfitters & London Bridge.
 *
 * Usage:
 *   node scripts/fix-sourced-brand-names.js
 *
 * Requires MONGODB_SCRAPED_URI or MONGODB_URI in environment (.env.local supported).
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Load environment variables, prioritizing .env.local
try {
  const dotenv = require('dotenv');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    dotenv.config();
  }
} catch (error) {
  console.warn('⚠️  dotenv not available; relying on existing environment variables.');
}

const MONGO_URI = process.env.MONGODB_SCRAPED_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ Missing MONGODB_SCRAPED_URI or MONGODB_URI. Aborting.');
  process.exit(1);
}

const SourcedProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true, index: true },
    categoryGroup: { type: String, required: true, index: true },
    brand: { type: String, index: true },
    price: { type: Number },
    description: { type: String },
    images: [{ type: String }],
    specs: { type: Map, of: String },
  },
  { timestamps: true }
);

SourcedProductSchema.index({ categoryGroup: 1, title: 1 }, { unique: true });

const SourcedProduct =
  mongoose.models.SourcedProduct || mongoose.model('SourcedProduct', SourcedProductSchema);

function normalizeBrandName(raw, fallback) {
  const candidate = (raw ?? '').trim();
  if (!candidate) return fallback;
  return candidate
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function sanitizeSlug(raw) {
  const candidate = (raw ?? '').toString().trim();
  if (!candidate) return 'legacy';
  return candidate
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'legacy';
}

function deriveCollectionSlug(url) {
  if (!url) return 'legacy';
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const collectionsIdx = segments.indexOf('collections');
    if (collectionsIdx >= 0) {
      const afterCollections = segments.slice(collectionsIdx + 1);
      if (afterCollections.length > 0) {
        return sanitizeSlug(afterCollections.join('-'));
      }
    }
    if (segments.length > 0) {
      return sanitizeSlug(segments.join('-'));
    }
  } catch {
    // Fall through to sanitation
  }
  return sanitizeSlug(url);
}

function extractSlugFromCategoryGroup(categoryGroup) {
  if (!categoryGroup) return 'legacy';
  if (/^Brand:/i.test(categoryGroup)) {
    const parts = categoryGroup.split(':');
    if (parts.length >= 3) {
      return sanitizeSlug(parts.slice(2).join(':'));
    }
    return 'legacy';
  }
  if (/^London Bridge:/i.test(categoryGroup)) {
    const urlPart = categoryGroup.slice('London Bridge:'.length);
    return deriveCollectionSlug(urlPart);
  }
  return 'legacy';
}

async function run() {
  await mongoose.connect(MONGO_URI, { bufferCommands: false });
  console.log('✅ Connected to MongoDB');

  const filter = {
    $or: [
      { brand: /^outfiters$/i },
      { categoryGroup: /^Brand:outfiters/i },
      { categoryGroup: /^Brand:Outfitters$/i },
      { brand: /^london bridge$/i },
      { categoryGroup: /^London Bridge:/i },
      { categoryGroup: /^Brand:London Bridge$/i },
      { categoryGroup: /^Brand:London Bridge:[^:]*$/i },
    ],
  };

  const cursor = SourcedProduct.find(filter).cursor();
  let scanned = 0;
  let updated = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const originalBrand = doc.brand || '';
    const targetFallback =
      /london bridge/i.test(originalBrand) || /london bridge/i.test(doc.categoryGroup || '')
        ? 'London Bridge'
        : 'Outfitters';

    const normalizedBrand = normalizeBrandName(originalBrand, targetFallback);
    let slug = extractSlugFromCategoryGroup(doc.categoryGroup);

    if (slug === 'legacy' && /collections/i.test(doc.sourceUrl || '')) {
      slug = deriveCollectionSlug(doc.sourceUrl);
    }

    if (!slug || slug === '') {
      slug = 'legacy';
    }

    const newCategoryGroup = `Brand:${normalizedBrand}:${slug}`;

    const update = {};
    if (doc.brand !== normalizedBrand) {
      update.brand = normalizedBrand;
    }
    if (doc.categoryGroup !== newCategoryGroup) {
      update.categoryGroup = newCategoryGroup;
    }

    if (Object.keys(update).length > 0) {
      await SourcedProduct.updateOne({ _id: doc._id }, { $set: update });
      updated += 1;
      console.log(
        `🔧 Updated ${doc.title || doc._id}: brand "${originalBrand}" → "${normalizedBrand}", categoryGroup "${doc.categoryGroup}" → "${newCategoryGroup}"`
      );
    }
  }

  console.log(`\n📊 Scan complete. Reviewed ${scanned} sourced products; updated ${updated}.`);
  await mongoose.disconnect();
  console.log('✅ MongoDB connection closed');
}

run().catch(async (error) => {
  console.error('❌ Script failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});


