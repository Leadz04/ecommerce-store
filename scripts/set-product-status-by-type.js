/**
 * Script to set product status based on product type
 * - ONLY jackets, coats, suits, uppers, hoods, outerwear items → published
 * - All other items (including sandals, shoes, etc.) → draft
 * 
 * Run with: node scripts/set-product-status-by-type.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Product Schema (simplified for migration)
const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  tags: [String],
  category: String,
  productType: String,
  status: String,
  publishAt: Date,
}, { collection: 'products' });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

/**
 * Check if a product is an outerwear item (jackets, coats, etc.)
 * ONLY matches actual outerwear product types, NOT items that just mention leather/wool
 */
function isOuterwearItem(product) {
  // Outerwear-specific product types ONLY (not materials like leather/wool)
  const outerwearTypes = [
    'jacket',
    'coat',
    'blazer',
    'suit',
    'bomber',
    'puffer',
    'parka',
    'windbreaker',
    'trench',
    'cardigan',
    'sweater',
    'pullover',
    'hoodie',
    'vest',
    'waistcoat',
    'upper',
    'hood',
    'outerwear'
  ];

  // Only check name, category, and productType (NOT description or tags to avoid false positives)
  const typeText = [
    product.name || '',
    product.category || '',
    product.productType || ''
  ].join(' ').toLowerCase();

  // Check if any outerwear type keyword appears
  return outerwearTypes.some(type => typeText.includes(type));
}

async function setProductStatus() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all products
    const allProducts = await Product.find({}).select('_id name category productType tags status publishAt description');
    console.log(`📦 Found ${allProducts.length} total products\n`);

    let published = 0;
    let drafted = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of allProducts) {
      try {
        const productNum = published + drafted + skipped + errors + 1;
        console.log(`[${productNum}/${allProducts.length}] Processing: ${product._id}`);
        console.log(`  Name: "${product.name || 'N/A'}"`);
        console.log(`  Category: "${product.category || 'N/A'}"`);
        console.log(`  ProductType: "${product.productType || 'N/A'}"`);
        console.log(`  Current status: ${product.status || 'N/A'}`);
        console.log(`  Current publishAt: ${product.publishAt || 'N/A'}`);

        const isOuterwear = isOuterwearItem(product);
        
        if (isOuterwear) {
          // Set to published
          const updateData = {
            status: 'published',
            publishAt: product.publishAt || new Date() // Set publishAt if not already set
          };
          
          // Check if update is needed
          if (product.status === 'published' && product.publishAt) {
            console.log(`  ⏭️  Skipping - already published`);
            skipped++;
            continue;
          }

          await Product.findByIdAndUpdate(product._id, updateData);
          published++;
          console.log(`  ✅ Set to PUBLISHED (outerwear item: jacket/coat/suit/etc.)`);
          if (!product.publishAt) {
            console.log(`     → publishAt set to: ${updateData.publishAt.toISOString()}`);
          }
        } else {
          // Set to draft
          const updateData = {
            status: 'draft',
            publishAt: null
          };
          
          // Check if update is needed
          if (product.status === 'draft' && !product.publishAt) {
            console.log(`  ⏭️  Skipping - already draft`);
            skipped++;
            continue;
          }

          await Product.findByIdAndUpdate(product._id, updateData);
          drafted++;
          console.log(`  📝 Set to DRAFT (not an outerwear item)`);
        }

        if ((published + drafted) % 50 === 0) {
          console.log(`\n📊 Progress: ${published} published, ${drafted} drafted, ${skipped} skipped, ${errors} errors\n`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing product ${product._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('=== Migration Complete ===');
    console.log('='.repeat(50));
    console.log(`Total products: ${allProducts.length}`);
    console.log(`✅ Published (outerwear items only): ${published}`);
    console.log(`📝 Drafted (all other items): ${drafted}`);
    console.log(`⏭️  Skipped (no changes needed): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`Total processed: ${published + drafted + skipped + errors}`);

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
setProductStatus();
