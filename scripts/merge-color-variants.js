/*
  Merge Color Variants - Keep One Product Per Group
  ================================================
  
  This script finds products that differ only by color and:
  1. Keeps the "best" product from each group
  2. Deletes all other color variants from the database
  
  Usage:
    node scripts/merge-color-variants.js --dry-run  # Preview only (safe)
    node scripts/merge-color-variants.js            # Actually delete (DANGEROUS!)
*/

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

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

// Score a product to determine which one to keep
function scoreProduct(product) {
  let score = 0;
  
  // Higher score = better product to keep
  if (product.status === 'published') score += 10;
  if (product.status === 'draft') score += 5;
  if (product.inStock) score += 5;
  if (product.etsyExported) score += 3;
  if (product.stockCount > 0) score += 2;
  if (product.rating > 0) score += 1;
  if (product.reviewCount > 0) score += 1;
  
  // Prefer products with more complete data
  if (product.description && product.description.length > 50) score += 2;
  if (product.images && product.images.length > 0) score += 1;
  if (product.brand) score += 1;
  
  // Prefer black color (most common/popular)
  const color = extractColor(product.name);
  if (color === 'black') score += 2;
  
  const updatedAt = product.updatedAt ? new Date(product.updatedAt).getTime() : 0;
  const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0;
  
  return { score, updatedAt, createdAt };
}

// Pick the best product to keep from a group
function pickBestProduct(products) {
  return products
    .slice()
    .sort((a, b) => {
      const sa = scoreProduct(a);
      const sb = scoreProduct(b);
      
      // Sort by score (highest first)
      if (sb.score !== sa.score) return sb.score - sa.score;
      // Then by most recently updated
      if (sb.updatedAt !== sa.updatedAt) return sb.updatedAt - sa.updatedAt;
      // Then by most recently created
      return sb.createdAt - sa.createdAt;
    })[0]; // Return the first (best) one
}

// Ask for confirmation
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  
  console.log('🔍 Color Variant Merger Script');
  console.log('================================\n');
  
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI (or MONGODB_SCRAPED_URI) in environment.');
    process.exit(1);
  }

  console.log(`Mode: ${dryRun ? 'DRY RUN (safe)' : 'LIVE (DANGEROUS!)'}\n`);

  if (!dryRun && !force) {
    console.log('⚠️  WARNING: This will DELETE color variant products from your database!');
    console.log('   Only one product per color variant group will be kept.\n');
    
    const confirmed = await askConfirmation('Are you absolutely sure? Type "yes" to continue: ');
    if (!confirmed) {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }
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
    if (normalized.length >= 10) {
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

  console.log(`✅ Found ${colorVariantGroups.length} groups of color variants\n`);

  // Determine which products to keep and which to delete
  const toKeep = [];
  const toDelete = [];
  
  colorVariantGroups.forEach(group => {
    const best = pickBestProduct(group.products);
    toKeep.push(best);
    
    group.products.forEach(product => {
      if (product._id.toString() !== best._id.toString()) {
        toDelete.push(product);
      }
    });
  });

  console.log('📊 Summary:');
  console.log(`   Total groups: ${colorVariantGroups.length}`);
  console.log(`   Products to keep: ${toKeep.length}`);
  console.log(`   Products to delete: ${toDelete.length}\n`);

  // Show what will be kept and deleted
  console.log('='.repeat(80));
  console.log('PRODUCTS TO KEEP (one per group):');
  console.log('='.repeat(80));
  toKeep.forEach((product, idx) => {
    const color = extractColor(product.name) || 'N/A';
    console.log(`${idx + 1}. [${color}] ${product.name}`);
    console.log(`   ID: ${product._id} | Price: $${product.price || 'N/A'}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTS TO DELETE:');
  console.log('='.repeat(80));
  toDelete.forEach((product, idx) => {
    const color = extractColor(product.name) || 'N/A';
    console.log(`${idx + 1}. [${color}] ${product.name}`);
    console.log(`   ID: ${product._id} | Price: $${product.price || 'N/A'}`);
  });

  if (dryRun) {
    console.log('\n✅ Dry run complete. No products were deleted.');
    await conn.close();
    return;
  }

  // Actually delete the products
  console.log(`\n🗑️  Deleting ${toDelete.length} color variant products...`);
  
  let deleted = 0;
  let errors = 0;
  
  for (const product of toDelete) {
    try {
      await Product.deleteOne({ _id: product._id });
      deleted++;
      if (deleted % 10 === 0) {
        console.log(`   ✅ Deleted ${deleted}/${toDelete.length} products...`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Error deleting ${product._id}: ${error.message}`);
    }
  }

  console.log(`\n✅ Deletion complete!`);
  console.log(`   Deleted: ${deleted}`);
  if (errors > 0) {
    console.log(`   Errors: ${errors}`);
  }
  console.log(`   Kept: ${toKeep.length} products`);

  await conn.close();
  console.log('\n✅ Operation complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

