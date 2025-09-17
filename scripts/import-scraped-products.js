/*
  Usage:
    node scripts/import-scraped-products.js path/to/scraped.csv

  CSV headers expected:
  title,price_sale,price_regular,url,image_url,out_of_stock,description,product_type,tags,variants,images
*/
const fs = require('fs');
const path = require('path');
// Load env vars (supports Next.js style .env.local when running as a node script)
try {
  const dotenv = require('dotenv');
  // prioritize .env.local if present, else fallback to default resolution
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    dotenv.config();
  }
} catch (_) {
  // dotenv is optional; ignore if not installed
}
const { MongoClient } = require('mongodb');

function parsePrice(value) {
  if (!value) return undefined;
  const cleaned = String(value)
    .replace(/rs\.?/gi, '')
    .replace(/[,\s]/g, '')
    .trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function parseBoolean(value) {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

function splitPipes(field) {
  if (!field) return [];
  return String(field)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseVariants(field) {
  if (!field) return [];
  // Variants separated by '||'
  const chunks = String(field).split('||').map((s) => s.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const parts = chunk.split('|').map((s) => s.trim());
    const variant = { title: undefined, sku: undefined, price: undefined, originalPrice: undefined, available: undefined, inventory: undefined };
    for (const part of parts) {
      if (!part) continue;
      if (part.toLowerCase().startsWith('sku')) {
        const sku = part.split(':')[1]?.trim() || '';
        if (sku) variant.sku = sku;
        continue;
      }
      if (/^available\s*:/i.test(part)) {
        variant.available = parseBoolean(part.split(':')[1]);
        continue;
      }
      if (/^inventory\s*:/i.test(part)) {
        const invRaw = part.split(':')[1];
        const inv = invRaw && invRaw.trim() !== '' ? Number(invRaw.trim()) : null;
        variant.inventory = Number.isFinite(inv) ? inv : null;
        continue;
      }
      if (/^rs\./i.test(part.trim())) {
        const price = parsePrice(part);
        if (variant.price === undefined) variant.price = price;
        else if (variant.originalPrice === undefined) variant.originalPrice = price;
        continue;
      }
      // If not matched above and reasonably short, treat as title/option
      if (!variant.title) variant.title = part;
    }
    return variant;
  });
}

function parseImages(field) {
  if (!field) return [];
  return field
    .split('|')
    .map((s) => s.trim())
    .filter((u) => u && /^https?:/i.test(u));
}

// Minimal CSV reader that handles quoted fields and commas within quotes
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = [];
  let i = 0;
  const len = content.length;
  let row = [];
  let field = '';
  let inQuotes = false;
  while (i < len) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    if (char === '\r') { i++; continue; }
    field += char;
    i++;
  }
  // push last field/row
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);

  // Convert to objects using header
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== '')).map((r) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = r[idx] ?? '';
    });
    return obj;
  });
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/import-scraped-products.js path/to/scraped.csv');
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Please set MONGODB_URI environment variable');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    const rows = readCSV(abs);
    console.log(`Parsed ${rows.length} rows from CSV`);

    await client.connect();
    const db = client.db();
    const col = db.collection('products');

    let upserts = 0;
    for (const row of rows) {
      const title = row.title?.trim();
      const price = parsePrice(row.price_sale);
      const originalPrice = parsePrice(row.price_regular);
      const sourceUrl = row.url?.trim();
      const imageUrl = row.image_url?.trim();
      const outOfStock = parseBoolean(row.out_of_stock);
      let description = (row.description || '').trim();
      // Guard against overly long descriptions
      const MAX_DESC = 5000;
      if (description.length > MAX_DESC) {
        description = description.slice(0, MAX_DESC);
      }
      const productType = (row.product_type || '').trim() || undefined;
      const tags = splitPipes(row.tags);
      const variants = parseVariants(row.variants);
      const images = parseImages(row.images);

      const document = {
        name: title,
        description: description || title || '',
        price: typeof price === 'number' ? price : 0,
        originalPrice,
        image: imageUrl || images[0] || '',
        images,
        category: productType || 'Clothing',
        brand: 'Other',
        rating: 0,
        reviewCount: 0,
        inStock: outOfStock === undefined ? true : !outOfStock,
        stockCount: 0,
        tags,
        specifications: {},
        isActive: true,
        sourceUrl,
        productType,
        variants: variants && variants.length ? variants : undefined,
        updatedAt: new Date(),
      };
      if (!document.name) continue;
      if (!document.image && images.length) document.image = images[0];

      const filter = sourceUrl ? { sourceUrl } : { name: document.name };
      const update = { $set: document, $setOnInsert: { createdAt: new Date() } };
      const res = await col.updateOne(filter, update, { upsert: true });
      if (res.upsertedCount || res.modifiedCount) upserts += 1;
    }

    console.log(`Upserted ${upserts} products`);
    await col.createIndex({ name: 'text', description: 'text', tags: 'text' });
    await col.createIndex({ category: 1 });
    await col.createIndex({ brand: 1 });
    await col.createIndex({ price: 1 });
    await col.createIndex({ rating: -1 });
    await col.createIndex({ sourceUrl: 1 }, { sparse: true });
    console.log('Indexes ensured');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();


