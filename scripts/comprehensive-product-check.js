/*
  Comprehensive Product Duplicate Check
  =====================================
  
  This script performs a thorough check for all types of duplicates:
  1. Color variants (products that differ only by color)
  2. Exact name duplicates (same normalized name and category)
  3. Similar name duplicates (fuzzy matching)
  4. Same image URL duplicates
  5. Same source URL duplicates
  6. Products with missing critical data
  
  Usage:
    node scripts/comprehensive-product-check.js
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

// Common color words
const COLOR_WORDS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'brown', 'gray', 'grey', 'beige', 'tan', 'navy', 'maroon', 'burgundy', 'crimson',
  'ivory', 'cream', 'khaki', 'olive', 'teal', 'turquoise', 'cyan', 'magenta',
  'silver', 'gold', 'bronze', 'copper', 'platinum', 'charcoal', 'slate',
  'camel', 'taupe', 'mocha', 'espresso', 'cognac', 'mahogany', 'walnut',
  'coral', 'salmon', 'peach', 'apricot', 'lime', 'mint', 'sage', 'forest',
  'royal', 'sky', 'ocean', 'midnight', 'ebony', 'ivory', 'bone', 'pearl',
  'champagne', 'amber', 'rust', 'copper', 'rose', 'blush', 'lavender', 'lilac',
  'violet', 'indigo', 'azure', 'cerulean', 'emerald', 'jade', 'olive', 'lime'
];

function normalizeName(name) {
  if (!name) return '';
  let normalized = name
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/gi, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  
  // Remove color words for color variant detection
  COLOR_WORDS.forEach(color => {
    const regex = new RegExp(`\\b${color}\\b`, 'gi');
    normalized = normalized.replace(regex, '').trim();
  });
  
  return normalized.replace(/\s+/g, ' ').trim();
}

function normalizeNameExact(name) {
  if (!name) return '';
  return name
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/gi, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function extractColor(name) {
  if (!name) return null;
  const lowerName = name.toLowerCase();
  for (const color of COLOR_WORDS) {
    if (lowerName.includes(color)) {
      return color;
    }
  }
  return null;
}

function areSimilar(p1, p2) {
  const name1 = normalizeName(p1.name || '');
  const name2 = normalizeName(p2.name || '');
  
  if (name1.length < 10 || name2.length < 10) return false;
  if (name1 !== name2) return false;
  
  const cat1 = (p1.category || '').toLowerCase().trim();
  const cat2 = (p2.category || '').toLowerCase().trim();
  if (cat1 && cat2 && cat1 !== cat2) return false;
  
  const price1 = parseFloat(p1.price) || 0;
  const price2 = parseFloat(p2.price) || 0;
  if (price1 > 0 && price2 > 0) {
    const diff = Math.abs(price1 - price2);
    const maxDiff = Math.max(price1 * 0.2, 20);
    if (diff > maxDiff) return false;
  }
  
  return true;
}

function similarity(str1, str2) {
  const s1 = normalizeNameExact(str1);
  const s2 = normalizeNameExact(str2);
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }
  
  const words1 = new Set(s1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(s2.split(' ').filter(w => w.length > 2));
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = url.toString().trim();
  try {
    const urlObj = new URL(trimmed);
    urlObj.hash = '';
    const sanitizedSearch = new URLSearchParams(urlObj.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(param => {
      sanitizedSearch.delete(param);
    });
    urlObj.search = sanitizedSearch.toString();
    return `${urlObj.hostname}${urlObj.pathname}${urlObj.search}`.toLowerCase();
  } catch (err) {
    return trimmed.toLowerCase();
  }
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI (or MONGODB_SCRAPED_URI) in environment.');
    process.exit(1);
  }

  console.log('🔍 Comprehensive Product Duplicate Check');
  console.log('========================================\n');

  console.log('🔌 Connecting to MongoDB...');
  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');

  console.log('📥 Loading all products...');
  const allProducts = await Product.find({}).lean();
  console.log(`📦 Found ${allProducts.length} total products\n`);

  const issues = {
    colorVariants: [],
    exactDuplicates: [],
    similarDuplicates: [],
    sameImage: [],
    sameSourceUrl: [],
    missingData: []
  };

  // 1. Check for color variants
  console.log('🔍 Checking for color variants...');
  const byNormalizedName = new Map();
  allProducts.forEach(product => {
    const normalized = normalizeName(product.name || '');
    if (normalized.length >= 10) {
      if (!byNormalizedName.has(normalized)) {
        byNormalizedName.set(normalized, []);
      }
      byNormalizedName.get(normalized).push(product);
    }
  });

  for (const [normalizedName, products] of byNormalizedName.entries()) {
    if (products.length < 2) continue;
    
    const similarProducts = [];
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        if (areSimilar(products[i], products[j])) {
          if (!similarProducts.includes(products[i])) similarProducts.push(products[i]);
          if (!similarProducts.includes(products[j])) similarProducts.push(products[j]);
        }
      }
    }
    
    if (similarProducts.length >= 2) {
      const colors = similarProducts.map(p => extractColor(p.name)).filter(c => c !== null);
      if (colors.length >= 2 && new Set(colors).size >= 2) {
        issues.colorVariants.push({
          normalizedName,
          products: similarProducts,
          count: similarProducts.length
        });
      }
    }
  }
  console.log(`   Found ${issues.colorVariants.length} color variant groups\n`);

  // 2. Check for exact duplicates (same normalized name + category)
  console.log('🔍 Checking for exact name duplicates...');
  const byExactName = new Map();
  allProducts.forEach(p => {
    const key = `${normalizeNameExact(p.name || '')}|${(p.category || '').toLowerCase().trim()}`;
    if (key.length >= 10) {
      if (!byExactName.has(key)) byExactName.set(key, []);
      byExactName.get(key).push(p);
    }
  });

  for (const [key, products] of byExactName.entries()) {
    if (products.length > 1) {
      issues.exactDuplicates.push({
        key,
        products,
        count: products.length
      });
    }
  }
  console.log(`   Found ${issues.exactDuplicates.length} exact duplicate groups\n`);

  // 3. Check for similar names (fuzzy matching)
  console.log('🔍 Checking for similar name duplicates...');
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
      const cat1 = (p1.category || '').toLowerCase();
      const cat2 = (p2.category || '').toLowerCase();
      const sameCategory = !cat1 || !cat2 || cat1 === cat2;
      
      if (sim >= 0.85 && sameCategory && !areSimilar(p1, p2)) {
        group.push(p2);
        processed.add(j);
      }
    }
    
    if (group.length > 1) {
      processed.add(i);
      issues.similarDuplicates.push({
        key: name1.substring(0, 50),
        products: group,
        count: group.length
      });
    }
  }
  console.log(`   Found ${issues.similarDuplicates.length} similar name groups\n`);

  // 4. Check for same image URL
  console.log('🔍 Checking for products with same image URL...');
  const byImage = new Map();
  allProducts.forEach(p => {
    const img = (p.image || '').trim();
    if (img.length > 10) {
      if (!byImage.has(img)) byImage.set(img, []);
      byImage.get(img).push(p);
    }
  });

  for (const [img, products] of byImage.entries()) {
    if (products.length > 1) {
      issues.sameImage.push({
        image: img.substring(0, 80),
        products,
        count: products.length
      });
    }
  }
  console.log(`   Found ${issues.sameImage.length} groups with same image\n`);

  // 5. Check for same source URL
  console.log('🔍 Checking for products with same source URL...');
  const bySourceUrl = new Map();
  allProducts.forEach(p => {
    const url = normalizeUrl(p.sourceUrl || '');
    if (url.length > 5) {
      if (!bySourceUrl.has(url)) bySourceUrl.set(url, []);
      bySourceUrl.get(url).push(p);
    }
  });

  for (const [url, products] of bySourceUrl.entries()) {
    if (products.length > 1) {
      issues.sameSourceUrl.push({
        url: url.substring(0, 80),
        products,
        count: products.length
      });
    }
  }
  console.log(`   Found ${issues.sameSourceUrl.length} groups with same source URL\n`);

  // 6. Check for missing critical data
  console.log('🔍 Checking for products with missing critical data...');
  allProducts.forEach(p => {
    const problems = [];
    if (!p.name || p.name.trim().length === 0) problems.push('missing name');
    if (!p.description || p.description.trim().length === 0) problems.push('missing description');
    if (!p.price || p.price <= 0) problems.push('missing/invalid price');
    if (!p.image || p.image.trim().length === 0) problems.push('missing image');
    if (!p.category) problems.push('missing category');
    
    if (problems.length > 0) {
      issues.missingData.push({
        product: p,
        problems,
        id: p._id
      });
    }
  });
  console.log(`   Found ${issues.missingData.length} products with missing data\n`);

  // Print summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Color variant groups: ${issues.colorVariants.length}`);
  console.log(`Exact duplicate groups: ${issues.exactDuplicates.length}`);
  console.log(`Similar name groups: ${issues.similarDuplicates.length}`);
  console.log(`Same image groups: ${issues.sameImage.length}`);
  console.log(`Same source URL groups: ${issues.sameSourceUrl.length}`);
  console.log(`Products with missing data: ${issues.missingData.length}`);
  console.log();

  // Show details
  if (issues.colorVariants.length > 0) {
    console.log('⚠️  COLOR VARIANTS FOUND:');
    issues.colorVariants.forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.normalizedName.substring(0, 50)}... (${group.count} products)`);
      group.products.forEach(p => {
        const color = extractColor(p.name) || 'N/A';
        console.log(`   - [${color}] ${p.name} (ID: ${p._id})`);
      });
    });
    console.log();
  }

  if (issues.exactDuplicates.length > 0) {
    console.log('⚠️  EXACT DUPLICATES FOUND:');
    issues.exactDuplicates.forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.key} (${group.count} products)`);
      group.products.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id}, Price: $${p.price || 'N/A'})`);
      });
    });
    console.log();
  }

  if (issues.similarDuplicates.length > 0) {
    console.log('⚠️  SIMILAR NAME DUPLICATES FOUND:');
    issues.similarDuplicates.slice(0, 10).forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.key}... (${group.count} products)`);
      group.products.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id})`);
      });
    });
    if (issues.similarDuplicates.length > 10) {
      console.log(`   ... and ${issues.similarDuplicates.length - 10} more groups`);
    }
    console.log();
  }

  if (issues.sameImage.length > 0) {
    console.log('⚠️  PRODUCTS WITH SAME IMAGE:');
    issues.sameImage.slice(0, 10).forEach((group, idx) => {
      console.log(`\n${idx + 1}. Image: ${group.image}... (${group.count} products)`);
      group.products.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id})`);
      });
    });
    if (issues.sameImage.length > 10) {
      console.log(`   ... and ${issues.sameImage.length - 10} more groups`);
    }
    console.log();
  }

  if (issues.sameSourceUrl.length > 0) {
    console.log('⚠️  PRODUCTS WITH SAME SOURCE URL:');
    issues.sameSourceUrl.slice(0, 10).forEach((group, idx) => {
      console.log(`\n${idx + 1}. URL: ${group.url}... (${group.count} products)`);
      group.products.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id})`);
      });
    });
    if (issues.sameSourceUrl.length > 10) {
      console.log(`   ... and ${issues.sameSourceUrl.length - 10} more groups`);
    }
    console.log();
  }

  if (issues.missingData.length > 0) {
    console.log('⚠️  PRODUCTS WITH MISSING DATA:');
    issues.missingData.slice(0, 20).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.product.name || 'Unnamed'} (ID: ${item.id})`);
      console.log(`   Missing: ${item.problems.join(', ')}`);
    });
    if (issues.missingData.length > 20) {
      console.log(`   ... and ${issues.missingData.length - 20} more products`);
    }
    console.log();
  }

  const totalIssues = issues.colorVariants.length + 
                     issues.exactDuplicates.length + 
                     issues.similarDuplicates.length + 
                     issues.sameImage.length + 
                     issues.sameSourceUrl.length;

  if (totalIssues === 0 && issues.missingData.length === 0) {
    console.log('✅ No duplicates or issues found! All products look good.');
  } else {
    console.log(`\n⚠️  Total issue groups found: ${totalIssues}`);
    console.log(`⚠️  Products with missing data: ${issues.missingData.length}`);
  }

  await conn.close();
  console.log('\n✅ Check complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

