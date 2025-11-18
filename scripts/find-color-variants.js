/*
  Find Products with Only Color Differences
  ========================================
  
  This script finds products that are essentially the same but differ only in color.
  It normalizes product names by removing color words and groups similar products.
  
  Usage:
    node scripts/find-color-variants.js
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

// Common color words to identify and remove
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

// Normalize name by removing color words and extra spaces
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
  
  // Remove color words
  COLOR_WORDS.forEach(color => {
    const regex = new RegExp(`\\b${color}\\b`, 'gi');
    normalized = normalized.replace(regex, '').trim();
  });
  
  // Clean up extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Extract color from product name
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

// Check if two products are similar (same normalized name, same category, similar price)
function areSimilar(p1, p2) {
  const name1 = normalizeName(p1.name || '');
  const name2 = normalizeName(p2.name || '');
  
  if (name1.length < 10 || name2.length < 10) return false;
  if (name1 !== name2) return false;
  
  // Must be in same category
  const cat1 = (p1.category || '').toLowerCase().trim();
  const cat2 = (p2.category || '').toLowerCase().trim();
  if (cat1 && cat2 && cat1 !== cat2) return false;
  
  // Price should be similar (within 20% or $20)
  const price1 = parseFloat(p1.price) || 0;
  const price2 = parseFloat(p2.price) || 0;
  if (price1 > 0 && price2 > 0) {
    const diff = Math.abs(price1 - price2);
    const maxDiff = Math.max(price1 * 0.2, 20);
    if (diff > maxDiff) return false;
  }
  
  return true;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI (or MONGODB_SCRAPED_URI) in environment.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');

  console.log('📥 Loading all products...');
  const allProducts = await Product.find({}).lean();
  console.log(`📦 Found ${allProducts.length} products\n`);

  // Group products by normalized name
  console.log('🔍 Analyzing products for color variants...\n');
  const byNormalizedName = new Map();
  
  allProducts.forEach(product => {
    const normalized = normalizeName(product.name || '');
    if (normalized.length >= 10) { // Only consider products with meaningful names
      if (!byNormalizedName.has(normalized)) {
        byNormalizedName.set(normalized, []);
      }
      byNormalizedName.get(normalized).push(product);
    }
  });

  // Find groups with multiple products (potential color variants)
  const colorVariantGroups = [];
  
  for (const [normalizedName, products] of byNormalizedName.entries()) {
    if (products.length < 2) continue;
    
    // Filter to only include products that are actually similar
    const similarProducts = [];
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        if (areSimilar(products[i], products[j])) {
          if (!similarProducts.includes(products[i])) similarProducts.push(products[i]);
          if (!similarProducts.includes(products[j])) similarProducts.push(products[j]);
        }
      }
    }
    
    // If we have multiple similar products, check if they differ by color
    if (similarProducts.length >= 2) {
      const colors = similarProducts
        .map(p => extractColor(p.name))
        .filter(c => c !== null);
      
      // If we have different colors, it's a color variant group
      if (colors.length >= 2 && new Set(colors).size >= 2) {
        colorVariantGroups.push({
          normalizedName,
          products: similarProducts,
          colors: [...new Set(colors)],
          count: similarProducts.length
        });
      }
    }
  }

  // Sort by count (most variants first)
  colorVariantGroups.sort((a, b) => b.count - a.count);

  console.log(`\n✅ Found ${colorVariantGroups.length} groups of color variants\n`);
  console.log('='.repeat(80));
  console.log('COLOR VARIANT GROUPS');
  console.log('='.repeat(80));
  console.log();

  let totalVariants = 0;
  colorVariantGroups.forEach((group, index) => {
    totalVariants += group.count;
    console.log(`\n📦 Group ${index + 1}: ${group.normalizedName.substring(0, 60)}...`);
    console.log(`   Colors: ${group.colors.join(', ')}`);
    console.log(`   Count: ${group.count} products`);
    console.log(`   Category: ${group.products[0].category || 'N/A'}`);
    console.log();
    console.log('   Products:');
    
    group.products.forEach((product, idx) => {
      const color = extractColor(product.name) || 'N/A';
      const price = product.price ? `$${product.price.toFixed(2)}` : 'N/A';
      const status = product.status || 'draft';
      const inStock = product.inStock ? '✓' : '✗';
      console.log(`   ${idx + 1}. [${color}] ${product.name}`);
      console.log(`      ID: ${product._id}`);
      console.log(`      Price: ${price} | Stock: ${inStock} | Status: ${status}`);
    });
    
    console.log('\n' + '-'.repeat(80));
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total groups: ${colorVariantGroups.length}`);
  console.log(`   Total variant products: ${totalVariants}`);
  console.log(`   Average variants per group: ${(totalVariants / colorVariantGroups.length).toFixed(2)}`);
  
  // Show top 10 groups by variant count
  if (colorVariantGroups.length > 0) {
    console.log(`\n🏆 Top 10 groups with most variants:`);
    colorVariantGroups.slice(0, 10).forEach((group, idx) => {
      console.log(`   ${idx + 1}. ${group.count} variants - ${group.normalizedName.substring(0, 50)}... (${group.colors.join(', ')})`);
    });
  }

  await conn.close();
  console.log('\n✅ Analysis complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

