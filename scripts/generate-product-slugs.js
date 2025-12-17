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
      console.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all products without slugs
    const productsWithoutSlugs = await Product.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).select('_id name slug');

    console.log(`Found ${productsWithoutSlugs.length} products without slugs`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of productsWithoutSlugs) {
      try {
        if (!product.name) {
          console.log(`Skipping product ${product._id} - no name`);
          skipped++;
          continue;
        }

        // Generate base slug
        const baseSlug = generateSlug(product.name);
        
        if (!baseSlug) {
          console.log(`Skipping product ${product._id} - could not generate slug from name: "${product.name}"`);
          skipped++;
          continue;
        }

        // Check if slug already exists
        let slug = baseSlug;
        let counter = 1;
        
        while (await Product.findOne({ slug, _id: { $ne: product._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Update product with slug
        await Product.findByIdAndUpdate(product._id, { slug });
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`Progress: ${updated} products updated...`);
        }
      } catch (error) {
        console.error(`Error processing product ${product._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total processed: ${productsWithoutSlugs.length}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
generateSlugs();
