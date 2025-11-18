/*
  Remove duplicate Product documents based on sourceUrl or normalized name/category.
  Usage:
    node scripts/remove-product-duplicates.js            # live delete
    node scripts/remove-product-duplicates.js --dry-run  # preview only
    node scripts/remove-product-duplicates.js --mode=source   # only sourceUrl dedupe
    node scripts/remove-product-duplicates.js --mode=name     # only name/category dedupe

  The script keeps the "best" document in each duplicate group (published > draft,
  exported > not exported, newest update wins) and deletes the rest.
*/

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const ENV_PATH = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
} else {
  require('dotenv').config();
}

const MODES = new Set(['source', 'name', 'both']);
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const modeArg = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'both';
const mode = MODES.has(modeArg) ? modeArg : 'both';

function normalizeWhitespace(input) {
  return input
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(name) {
  if (!name) return '';
  return normalizeWhitespace(
    name
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&amp;/gi, 'and')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/gi, ' ')
      .toLowerCase()
  );
}

function normalizeCategory(category) {
  return normalizeWhitespace((category || 'uncategorized').toString().toLowerCase());
}

function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = url.toString().trim();
  try {
    const urlObj = new URL(trimmed);
    urlObj.hash = '';
    const sanitizedSearch = new URLSearchParams(urlObj.search);
    // Remove trivial tracking params to maximize dedupe hits
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(param => {
      sanitizedSearch.delete(param);
    });
    urlObj.search = sanitizedSearch.toString();
    return `${urlObj.hostname}${urlObj.pathname}${urlObj.search}`.toLowerCase();
  } catch (err) {
    return trimmed.toLowerCase();
  }
}

function scoreDocument(doc) {
  let score = 0;
  if (doc.status === 'published') score += 5;
  if (doc.etsyExported) score += 3;
  if (doc.inStock) score += 1;
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  const createdAt = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;
  return { score, updatedAt, createdAt };
}

function pickKeeper(docs) {
  return docs
    .slice()
    .sort((a, b) => {
      const sa = scoreDocument(a);
      const sb = scoreDocument(b);
      if (sb.score !== sa.score) return sb.score - sa.score;
      if (sb.updatedAt !== sa.updatedAt) return sb.updatedAt - sa.updatedAt;
      return sb.createdAt - sa.createdAt;
    });
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI (or MONGODB_SCRAPED_URI) in environment.');
    process.exit(1);
  }

  console.log(`🔌 Connecting to MongoDB... (${dryRun ? 'dry run' : 'live'})`);
  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');

  const projection = {
    name: 1,
    category: 1,
    sourceUrl: 1,
    status: 1,
    etsyExported: 1,
    inStock: 1,
    updatedAt: 1,
    createdAt: 1,
    price: 1
  };

  console.log('📥 Scanning products for duplicates ...');
  const cursor = Product.find({}, projection).lean().cursor();

  const bySource = new Map();
  const byName = new Map();
  let examined = 0;

  for await (const doc of cursor) {
    examined += 1;
    const normalizedSource = normalizeUrl(doc.sourceUrl);
    if (normalizedSource && (mode === 'source' || mode === 'both')) {
      if (!bySource.has(normalizedSource)) bySource.set(normalizedSource, []);
      bySource.get(normalizedSource).push(doc);
    }

    if (mode === 'name' || mode === 'both') {
      const normalizedName = normalizeName(doc.name);
      if (normalizedName.length >= 4) {
        const key = `${normalizedName}|${normalizeCategory(doc.category)}`;
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key).push(doc);
      }
    }
  }

  const removalPlan = [];
  const removedIds = new Set();
  const keepers = new Set();

  function planRemovals(map, reason) {
    for (const [key, docs] of map.entries()) {
      if (docs.length < 2) continue;
      const ordered = pickKeeper(docs);
      const keep = ordered[0];
      keepers.add(String(keep._id));
      const duplicates = ordered.slice(1).filter(doc => !removedIds.has(String(doc._id)));
      if (!duplicates.length) continue;

      const removeIds = duplicates.map(doc => String(doc._id));
      removeIds.forEach(id => removedIds.add(id));
      removalPlan.push({
        reason,
        key,
        keep: {
          _id: keep._id,
          name: keep.name,
          sourceUrl: keep.sourceUrl,
          status: keep.status,
          price: keep.price
        },
        removeIds,
        removePreview: duplicates.slice(0, 3).map(doc => ({
          _id: doc._id,
          name: doc.name,
          sourceUrl: doc.sourceUrl,
          status: doc.status,
          price: doc.price
        }))
      });
    }
  }

  if (mode === 'source' || mode === 'both') planRemovals(bySource, 'sourceUrl');
  if (mode === 'name' || mode === 'both') planRemovals(byName, 'name+category');

  console.log(`🔎 Examined ${examined} products.`);
  console.log(`📦 Found ${removalPlan.length} duplicate group(s); ${removedIds.size} document(s) marked for deletion.`);

  if (!removalPlan.length) {
    await conn.close();
    console.log('✅ No duplicates detected.');
    return;
  }

  removalPlan.slice(0, 10).forEach((group, idx) => {
    console.log(`\nGroup #${idx + 1} (${group.reason}) -> keep ${group.keep._id}`);
    console.log(`Key: ${group.key}`);
    console.log(`Keeping: ${group.keep.name} [${group.keep.status}]`);
    group.removePreview.forEach(doc => {
      console.log(` - Removing candidate: ${doc._id} | ${doc.name} [${doc.status}]`);
    });
    if (group.removeIds.length > group.removePreview.length) {
      console.log(` ...and ${group.removeIds.length - group.removePreview.length} more in this group.`);
    }
  });

  if (dryRun) {
    console.log('\n🚫 Dry run enabled: no documents were deleted.');
    await conn.close();
    return;
  }

  console.log('\n🗑️  Deleting duplicate documents...');
  const deleteResult = await Product.deleteMany({ _id: { $in: Array.from(removedIds) } });
  console.log(`✅ Removed ${deleteResult.deletedCount || 0} duplicate documents.`);

  await conn.close();
  console.log('🔌 Connection closed.');
}

main().catch(err => {
  console.error('❌ Failed to remove duplicates:', err);
  process.exit(1);
});


