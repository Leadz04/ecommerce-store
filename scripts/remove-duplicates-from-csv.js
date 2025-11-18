/*
  Remove duplicate products from database based on CSV export.
  The CSV was exported from the database, so duplicates in CSV = duplicates in DB.
  
  Usage:
    node scripts/remove-duplicates-from-csv.js etsy-products-export-800-2025-11-18.csv --dry-run
    node scripts/remove-duplicates-from-csv.js etsy-products-export-800-2025-11-18.csv
*/

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const ENV_PATH = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
} else {
  require('dotenv').config();
}

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/gi, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push({
          title: row.Title || row.title || '',
          description: row.Description || row.description || '',
          category: row.Category || row.category || '',
          price: parseFloat(row.Price || row.price || 0),
        });
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const csvFile = args.find(arg => arg.endsWith('.csv'));
  const dryRun = args.includes('--dry-run');

  if (!csvFile || !fs.existsSync(csvFile)) {
    console.error('❌ Please provide a valid CSV file path');
    console.error('Usage: node scripts/remove-duplicates-from-csv.js <csv-file> [--dry-run]');
    process.exit(1);
  }

  console.log(`📄 Reading CSV file: ${csvFile}`);
  const csvRows = await parseCSV(csvFile);
  console.log(`📊 Found ${csvRows.length} rows in CSV`);

  // Group by normalized title
  const byTitle = new Map();
  csvRows.forEach((row, index) => {
    const normalized = normalizeTitle(row.title);
    if (normalized.length >= 4) {
      if (!byTitle.has(normalized)) {
        byTitle.set(normalized, []);
      }
      byTitle.get(normalized).push({ ...row, csvIndex: index });
    }
  });

  // Find duplicates
  const duplicates = [];
  for (const [normalizedTitle, rows] of byTitle.entries()) {
    if (rows.length > 1) {
      duplicates.push({
        normalizedTitle,
        count: rows.length,
        titles: rows.map(r => r.title),
        rows: rows
      });
    }
  }

  console.log(`🔍 Found ${duplicates.length} duplicate title groups in CSV`);
  if (duplicates.length > 0) {
    console.log('\n📋 Sample duplicates:');
    duplicates.slice(0, 5).forEach((dup, idx) => {
      console.log(`\n  ${idx + 1}. "${dup.titles[0]}" (${dup.count} occurrences)`);
      dup.rows.slice(0, 3).forEach((r, i) => {
        console.log(`     - Row ${r.csvIndex + 2}: ${r.title} | ${r.category} | $${r.price}`);
      });
    });
  }

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found in CSV');
    return;
  }

  // Connect to database
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI (or MONGODB_SCRAPED_URI) in environment.');
    process.exit(1);
  }

  console.log(`\n🔌 Connecting to MongoDB... (${dryRun ? 'dry run' : 'live'})`);
  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');

  // Find products in database that match duplicate titles
  const duplicateTitles = duplicates.map(d => d.normalizedTitle);
  const allProducts = await Product.find({}).lean();
  
  console.log(`\n📦 Found ${allProducts.length} products in database`);
  
  // Group database products by normalized title
  const dbByTitle = new Map();
  allProducts.forEach(product => {
    const productName = product.name || product.title || '';
    const normalized = normalizeTitle(productName);
    if (normalized.length >= 4) {
      if (!dbByTitle.has(normalized)) {
        dbByTitle.set(normalized, []);
      }
      dbByTitle.get(normalized).push(product);
    }
  });

  // Debug: Show some sample product names
  if (allProducts.length > 0) {
    console.log('\n📝 Sample product names from database:');
    allProducts.slice(0, 5).forEach(p => {
      console.log(`   - "${p.name}" (normalized: "${normalizeTitle(p.name)}")`);
    });
  }

  // Also check if there are products that match CSV duplicate titles
  console.log('\n🔍 Checking for products matching CSV duplicate titles...');
  const csvDuplicateTitles = duplicates.map(d => d.titles[0]);
  const matchingProducts = [];
  
  for (const csvTitle of csvDuplicateTitles.slice(0, 10)) {
    const normalized = normalizeTitle(csvTitle);
    const matches = allProducts.filter(p => {
      const pNorm = normalizeTitle(p.name || '');
      return pNorm === normalized || pNorm.includes(normalized) || normalized.includes(pNorm);
    });
    if (matches.length > 0) {
      matchingProducts.push({ csvTitle, normalized, matches: matches.length });
    }
  }
  
  if (matchingProducts.length > 0) {
    console.log(`   Found ${matchingProducts.length} CSV titles with potential matches in database`);
    matchingProducts.slice(0, 3).forEach(m => {
      console.log(`   - "${m.csvTitle.substring(0, 50)}" -> ${m.matches} potential matches`);
    });
  } else {
    console.log('   ⚠️  No products in database match CSV duplicate titles');
    console.log('   This suggests the CSV may be from Etsy listings, not the Product collection');
  }

  // Find database duplicates
  const dbDuplicates = [];
  const toDelete = new Set();
  
  for (const [normalizedTitle, products] of dbByTitle.entries()) {
    if (products.length > 1) {
      // Sort by: published > draft, exported > not exported, newest first
      const sorted = products.slice().sort((a, b) => {
        const scoreA = (a.status === 'published' ? 5 : 0) + (a.etsyExported ? 3 : 0) + (a.inStock ? 1 : 0);
        const scoreB = (b.status === 'published' ? 5 : 0) + (b.etsyExported ? 3 : 0) + (b.inStock ? 1 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (updatedB !== updatedA) return updatedB - updatedA;
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      });

      const keep = sorted[0];
      const remove = sorted.slice(1);
      
      dbDuplicates.push({
        normalizedTitle,
        keep: {
          _id: keep._id,
          name: keep.name || keep.title,
          status: keep.status,
          etsyExported: keep.etsyExported,
          price: keep.price
        },
        remove: remove.map(p => ({
          _id: p._id,
          name: p.name || p.title,
          status: p.status,
          etsyExported: p.etsyExported,
          price: p.price
        }))
      });

      remove.forEach(p => toDelete.add(String(p._id)));
    }
  }

  console.log(`\n🔍 Found ${dbDuplicates.length} duplicate groups in database`);
  console.log(`🗑️  ${toDelete.size} products marked for deletion`);

  if (dbDuplicates.length > 0) {
    console.log('\n📋 Sample duplicates to remove:');
    dbDuplicates.slice(0, 5).forEach((dup, idx) => {
      console.log(`\n  ${idx + 1}. "${dup.keep.name}"`);
      console.log(`     ✅ Keeping: ${dup.keep._id} [${dup.keep.status || 'draft'}] $${dup.keep.price || 0}`);
      dup.remove.slice(0, 3).forEach((r, i) => {
        console.log(`     ❌ Removing: ${r._id} [${r.status || 'draft'}] $${r.price || 0}`);
      });
      if (dup.remove.length > 3) {
        console.log(`     ... and ${dup.remove.length - 3} more`);
      }
    });
  }

  if (dryRun) {
    console.log('\n🚫 Dry run enabled: no documents were deleted.');
    await conn.close();
    return;
  }

  if (toDelete.size === 0) {
    console.log('\n✅ No duplicates to remove');
    await conn.close();
    return;
  }

  console.log(`\n🗑️  Deleting ${toDelete.size} duplicate documents...`);
  const deleteResult = await Product.deleteMany({ _id: { $in: Array.from(toDelete) } });
  console.log(`✅ Removed ${deleteResult.deletedCount || 0} duplicate documents.`);

  // Verify
  const remaining = await Product.countDocuments();
  console.log(`📊 Remaining products in database: ${remaining}`);

  await conn.close();
  console.log('🔌 Connection closed.');
}

main().catch(err => {
  console.error('❌ Failed to remove duplicates:', err);
  process.exit(1);
});

