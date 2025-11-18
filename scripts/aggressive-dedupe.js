/*
  Aggressive duplicate removal - checks for duplicates using multiple strategies:
  1. Exact normalized name match
  2. Similar name match (fuzzy)
  3. Same image URL
  4. Similar description
  
  Usage:
    node scripts/aggressive-dedupe.js --dry-run
    node scripts/aggressive-dedupe.js
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

function normalizeName(name) {
  if (!name) return '';
  return name
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

function similarity(str1, str2) {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }
  
  // Simple word overlap
  const words1 = new Set(s1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(s2.split(' ').filter(w => w.length > 2));
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
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
  return docs.slice().sort((a, b) => {
    const sa = scoreDocument(a);
    const sb = scoreDocument(b);
    if (sb.score !== sa.score) return sb.score - sa.score;
    if (sb.updatedAt !== sa.updatedAt) return sb.updatedAt - sa.updatedAt;
    return sb.createdAt - sa.createdAt;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const threshold = parseFloat(args.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '0.85');

  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI (or MONGODB_SCRAPED_URI) in environment.');
    process.exit(1);
  }

  console.log(`🔌 Connecting to MongoDB... (${dryRun ? 'dry run' : 'live'}, similarity threshold: ${threshold})`);
  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');

  console.log('📥 Loading all products...');
  const allProducts = await Product.find({}).lean();
  console.log(`📦 Found ${allProducts.length} products`);

  // Strategy 1: Exact normalized name match
  console.log('\n🔍 Strategy 1: Exact normalized name matches...');
  const byExactName = new Map();
  allProducts.forEach(p => {
    const key = normalizeName(p.name || '');
    if (key.length >= 4) {
      if (!byExactName.has(key)) byExactName.set(key, []);
      byExactName.get(key).push(p);
    }
  });
  
  const exactDuplicates = [];
  for (const [key, products] of byExactName.entries()) {
    if (products.length > 1) {
      exactDuplicates.push({ key, products, reason: 'exact_name' });
    }
  }
  console.log(`   Found ${exactDuplicates.length} exact duplicate groups`);

  // Strategy 2: Same image URL
  console.log('\n🔍 Strategy 2: Same image URL...');
  const byImage = new Map();
  allProducts.forEach(p => {
    const img = (p.image || '').trim();
    if (img.length > 10) {
      if (!byImage.has(img)) byImage.set(img, []);
      byImage.get(img).push(p);
    }
  });
  
  const imageDuplicates = [];
  for (const [img, products] of byImage.entries()) {
    if (products.length > 1) {
      imageDuplicates.push({ key: img.substring(0, 50), products, reason: 'same_image' });
    }
  }
  console.log(`   Found ${imageDuplicates.length} groups with same image`);

  // Strategy 3: Similar names (fuzzy)
  console.log('\n🔍 Strategy 3: Similar names (fuzzy matching)...');
  const similarDuplicates = [];
  const processed = new Set();
  
  for (let i = 0; i < allProducts.length; i++) {
    if (processed.has(i)) continue;
    const p1 = allProducts[i];
    const name1 = p1.name || '';
    if (name1.length < 10) continue;
    
    const group = [p1];
    for (let j = i + 1; j < allProducts.length; j++) {
      if (processed.has(j)) continue;
      const p2 = allProducts[j];
      const name2 = p2.name || '';
      if (name2.length < 10) continue;
      
      const sim = similarity(name1, name2);
      // Also check category - don't match Men's with Women's products
      const cat1 = (p1.category || '').toLowerCase();
      const cat2 = (p2.category || '').toLowerCase();
      const sameCategory = !cat1 || !cat2 || cat1 === cat2;
      
      if (sim >= threshold && sameCategory) {
        group.push(p2);
        processed.add(j);
      }
    }
    
    if (group.length > 1) {
      processed.add(i);
      similarDuplicates.push({ 
        key: name1.substring(0, 50), 
        products: group, 
        reason: 'similar_name' 
      });
    }
  }
  console.log(`   Found ${similarDuplicates.length} similar name groups`);

  // Combine all duplicates
  const allDuplicates = [...exactDuplicates, ...imageDuplicates, ...similarDuplicates];
  const toDelete = new Set();
  const keepers = new Set();

  console.log(`\n📊 Total duplicate groups found: ${allDuplicates.length}`);

  for (const dup of allDuplicates) {
    const ordered = pickKeeper(dup.products);
    const keep = ordered[0];
    const remove = ordered.slice(1);
    
    keepers.add(String(keep._id));
    remove.forEach(p => {
      if (!keepers.has(String(p._id))) {
        toDelete.add(String(p._id));
      }
    });
  }

  console.log(`🗑️  ${toDelete.size} products marked for deletion`);
  console.log(`✅ ${keepers.size} products to keep`);

  if (allDuplicates.length > 0) {
    console.log('\n📋 Sample duplicates:');
    allDuplicates.slice(0, 5).forEach((dup, idx) => {
      const ordered = pickKeeper(dup.products);
      const keep = ordered[0];
      const remove = ordered.slice(1);
      console.log(`\n  ${idx + 1}. ${dup.reason}: "${keep.name}"`);
      console.log(`     ✅ Keeping: ${keep._id} [${keep.status || 'draft'}]`);
      remove.slice(0, 3).forEach(r => {
        console.log(`     ❌ Removing: ${r._id} | "${r.name}" [${r.status || 'draft'}]`);
      });
      if (remove.length > 3) {
        console.log(`     ... and ${remove.length - 3} more`);
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

  const remaining = await Product.countDocuments();
  console.log(`📊 Remaining products in database: ${remaining}`);

  await conn.close();
  console.log('🔌 Connection closed.');
}

main().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});

