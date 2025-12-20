/**
 * Migration script to generate slugs for all existing products
 * Run with: node scripts/generate-product-slugs.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text, maxLength = 100) {
  if (!text) return '';
  
  return text
    .normalize('NFKD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase()
    .substring(0, maxLength) // Limit length
    .replace(/-$/, ''); // Remove trailing hyphen if truncated
}

// Product Schema (simplified for migration)
const ProductSchema = new mongoose.Schema({
  name: String,
  slug: String,
}, { collection: 'products' });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function generateSlugs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all products WITHOUT slugs (more efficient query)
    const productsWithoutSlugs = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).select('_id name slug');
    
    console.log(`📦 Found ${productsWithoutSlugs.length} products without slugs`);

    // Get all existing slugs in one query for faster lookup
    const existingSlugs = await Product.find({ 
      slug: { $exists: true, $ne: null, $ne: '' } 
    }).select('slug').lean();
    const slugSet = new Set(existingSlugs.map(p => p.slug));
    console.log(`📋 Found ${slugSet.size} existing slugs in database\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of productsWithoutSlugs) {
      try {
        const productNum = updated + skipped + errors + 1;
        console.log(`[${productNum}/${productsWithoutSlugs.length}] Processing product: ${product._id}`);
        console.log(`  Name: "${product.name || 'N/A'}"`);
        
        // Double-check: Skip if product already has a valid slug (shouldn't happen but safety check)
        if (product.slug && product.slug.trim() !== '') {
          console.log(`  ⏭️  Skipping - already has slug: "${product.slug}"`);
          skipped++;
          continue;
        }
        
        if (!product.name) {
          console.log(`  ❌ Skipping - no name`);
          skipped++;
          continue;
        }

        // Generate base slug
        const baseSlug = generateSlug(product.name);
        console.log(`  Base slug: "${baseSlug}"`);
        
        if (!baseSlug) {
          console.log(`  ❌ Skipping - could not generate slug from name`);
          skipped++;
          continue;
        }

        // Use base slug, append product ID if slug already exists (much faster than sequential checks)
        let slug = baseSlug;
        
        if (slugSet.has(slug)) {
          // Append last 6 characters of product ID to make it unique
          const productIdSuffix = product._id.toString().slice(-6);
          slug = `${baseSlug}-${productIdSuffix}`;
          console.log(`  ⚠️  Base slug taken, using: "${slug}" (appended product ID)`);
        }

        // Add the new slug to our set so subsequent products know it's taken
        slugSet.add(slug);

        // Update product with slug
        await Product.findByIdAndUpdate(product._id, { slug });
        updated++;
        console.log(`  ✅ Updated with slug: "${slug}"`);
        
        if (updated % 100 === 0) {
          console.log(`\n📊 Progress: ${updated} updated, ${skipped} skipped, ${errors} errors\n`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing product ${product._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('=== Migration Complete ===');
    console.log('='.repeat(50));
    console.log(`Total products without slugs: ${productsWithoutSlugs.length}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped (no name or already had slug): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`Total processed: ${updated + skipped + errors}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
generateSlugs();
