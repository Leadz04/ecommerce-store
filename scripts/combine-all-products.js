const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Product Schema (same as in src/models/Product.ts)
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  descriptionHtml: {
    type: String,
    required: false,
    maxlength: [20000, 'HTML description too long']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [{
    type: String
  }],
  imageAltTexts: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: {
    type: String,
    required: false,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockCount: {
    type: Number,
    required: false,
    default: 0,
    min: [0, 'Stock count cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  sourceUrl: {
    type: String,
    index: true,
    sparse: true,
  },
  productType: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishAt: {
    type: Date,
    default: null,
    index: true,
  },
  variants: [{
    title: { type: String },
    sku: { type: String },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    available: { type: Boolean },
    inventory: { type: Number, min: 0, required: false },
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

/**
 * Normalize title for duplicate checking (case-insensitive, trim whitespace)
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title.trim().toLowerCase();
}

/**
 * Calculate a "detail score" for a product to determine which is more detailed
 * Higher score = more detailed product
 */
function calculateDetailScore(product) {
  let score = 0;
  
  // Basic fields
  if (product.name && product.name.trim().length > 0) score += 1;
  if (product.description && product.description.trim().length > 100) score += 2;
  if (product.description && product.description.trim().length > 500) score += 1;
  if (product.descriptionHtml && product.descriptionHtml.trim().length > 0) score += 2;
  
  // Images
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    score += product.images.length; // More images = more detailed
  }
  if (product.imageAltTexts && Array.isArray(product.imageAltTexts) && product.imageAltTexts.length > 0) {
    score += product.imageAltTexts.length;
  }
  
  // Specifications
  if (product.specifications) {
    const specCount = Object.keys(product.specifications).length;
    score += specCount * 2; // Specifications are valuable
  }
  
  // Tags
  if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
    score += product.tags.length;
  }
  
  // Variants
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    score += product.variants.length * 2;
  }
  
  // Additional fields
  if (product.brand && product.brand.trim().length > 0) score += 1;
  if (product.category && product.category.trim().length > 0) score += 1;
  if (product.productType && product.productType.trim().length > 0) score += 1;
  if (product.originalPrice && product.originalPrice > 0) score += 1;
  if (product.stockCount !== undefined && product.stockCount !== null) score += 1;
  if (product.rating > 0) score += 1;
  if (product.reviewCount > 0) score += 1;
  
  // Status and metadata
  if (product.status && product.status !== 'draft') score += 1;
  if (product.publishAt) score += 1;
  
  return score;
}

/**
 * Merge two products, keeping the more detailed one
 * Returns the product to keep
 */
function mergeProducts(product1, product2) {
  const score1 = calculateDetailScore(product1);
  const score2 = calculateDetailScore(product2);
  
  // Keep the one with higher detail score
  if (score2 > score1) {
    return product2;
  }
  
  // If scores are equal, prefer the one from STAGE3 (target database)
  return product1;
}

async function combineAllProducts() {
  try {
    // Get database URIs
    const MONGODB_URI = process.env.MONGODB_URI;
    const MONGODB_URI_STAGE3 = process.env.MONGODB_URI_STAGE3;

    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    if (!MONGODB_URI_STAGE3) {
      console.error('❌ MONGODB_URI_STAGE3 is not set in environment variables');
      process.exit(1);
    }

    console.log('🔄 Connecting to databases...\n');

    // Connect to source database (MONGODB_URI)
    console.log('📦 Connecting to source database (MONGODB_URI)...');
    const sourceConn = await mongoose.createConnection(MONGODB_URI);
    const SourceProduct = sourceConn.model('Product', ProductSchema);
    console.log('✅ Connected to source database\n');

    // Connect to target database (MONGODB_URI_STAGE3)
    console.log('📦 Connecting to target database (MONGODB_URI_STAGE3)...');
    const targetConn = await mongoose.createConnection(MONGODB_URI_STAGE3);
    const TargetProduct = targetConn.model('Product', ProductSchema);
    console.log('✅ Connected to target database\n');

    // Get initial counts
    const [sourceCount, targetCount] = await Promise.all([
      SourceProduct.countDocuments(),
      TargetProduct.countDocuments()
    ]);

    console.log('📊 Current state:');
    console.log(`   - Products in source DB (MONGODB_URI): ${sourceCount}`);
    console.log(`   - Products in target DB (MONGODB_URI_STAGE3): ${targetCount}\n`);

    // Fetch all products from both databases
    console.log('📥 Fetching all products from source database...');
    const sourceProducts = await SourceProduct.find({}).lean();
    console.log(`✅ Fetched ${sourceProducts.length} products from source\n`);

    console.log('📥 Fetching all products from target database...');
    const targetProducts = await TargetProduct.find({}).lean();
    console.log(`✅ Fetched ${targetProducts.length} products from target\n`);

    // Build lookup maps for target products (for duplicate detection)
    const targetBySourceUrl = new Map();
    const targetByName = new Map();
    
    for (const product of targetProducts) {
      if (product.sourceUrl) {
        targetBySourceUrl.set(product.sourceUrl, product);
      }
      const normalizedName = normalizeTitle(product.name);
      if (normalizedName) {
        if (!targetByName.has(normalizedName)) {
          targetByName.set(normalizedName, []);
        }
        targetByName.get(normalizedName).push(product);
      }
    }

    console.log('🚀 Starting combination process...\n');

    // Statistics
    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let duplicateDetails = [];

    // Process each source product
    for (let i = 0; i < sourceProducts.length; i++) {
      const sourceProduct = sourceProducts[i];
      
      try {
        const sourceName = sourceProduct.name || 'Untitled Product';
        
        // Check for duplicates by sourceUrl first
        let existingProduct = null;
        let duplicateType = null;
        
        if (sourceProduct.sourceUrl) {
          existingProduct = targetBySourceUrl.get(sourceProduct.sourceUrl);
          if (existingProduct) {
            duplicateType = 'sourceUrl';
          }
        }

        // If not found by sourceUrl, check by normalized name
        if (!existingProduct) {
          const normalizedName = normalizeTitle(sourceProduct.name);
          if (normalizedName) {
            const candidates = targetByName.get(normalizedName);
            if (candidates && candidates.length > 0) {
              // If multiple candidates, prefer one with same sourceUrl or brand
              existingProduct = candidates.find(p => 
                p.sourceUrl === sourceProduct.sourceUrl || 
                (p.brand && sourceProduct.brand && p.brand.toLowerCase() === sourceProduct.brand.toLowerCase())
              ) || candidates[0];
              duplicateType = 'name';
            }
          }
        }

        if (existingProduct) {
          // Duplicate found - compare and keep the more detailed one
          const sourceScore = calculateDetailScore(sourceProduct);
          const existingScore = calculateDetailScore(existingProduct);
          
          if (sourceScore > existingScore) {
            // Source product is more detailed - update the target
            const productData = {
              ...sourceProduct,
              _id: existingProduct._id, // Keep the existing ID
              createdAt: existingProduct.createdAt, // Preserve original creation date
              updatedAt: new Date() // Update timestamp
            };
            
            await TargetProduct.findByIdAndUpdate(existingProduct._id, productData, { runValidators: true });
            updatedCount++;
            
            duplicateDetails.push({
              name: sourceName.substring(0, 50),
              type: duplicateType,
              action: 'updated',
              sourceScore,
              existingScore
            });
            
            console.log(`🔄 [${i + 1}/${sourceProducts.length}] Updated (more detailed): "${sourceName.substring(0, 50)}..." (${duplicateType} match, scores: ${sourceScore} > ${existingScore})`);
          } else {
            // Existing product is more detailed or equal - skip
            skippedCount++;
            duplicateDetails.push({
              name: sourceName.substring(0, 50),
              type: duplicateType,
              action: 'skipped',
              sourceScore,
              existingScore
            });
            console.log(`⏭️  [${i + 1}/${sourceProducts.length}] Skipped (less detailed): "${sourceName.substring(0, 50)}..." (${duplicateType} match, scores: ${sourceScore} <= ${existingScore})`);
          }
          continue;
        }

        // No duplicate found - import as new product
        const productData = {
          ...sourceProduct,
          _id: undefined, // Let MongoDB generate new ID
          createdAt: sourceProduct.createdAt || new Date(),
          updatedAt: new Date()
        };

        const newProduct = new TargetProduct(productData);
        await newProduct.save();
        importedCount++;

        // Update lookup maps for future duplicate detection
        if (newProduct.sourceUrl) {
          targetBySourceUrl.set(newProduct.sourceUrl, newProduct.toObject());
        }
        const normalizedName = normalizeTitle(newProduct.name);
        if (normalizedName) {
          if (!targetByName.has(normalizedName)) {
            targetByName.set(normalizedName, []);
          }
          targetByName.get(normalizedName).push(newProduct.toObject());
        }

        console.log(`✅ [${i + 1}/${sourceProducts.length}] Imported: "${sourceName.substring(0, 50)}..."`);

      } catch (error) {
        errorCount++;
        console.error(`❌ [${i + 1}/${sourceProducts.length}] Error processing "${sourceProduct.name || 'Unknown'}":`, error.message);
      }
    }

    // Final statistics
    const finalTargetCount = await TargetProduct.countDocuments();

    console.log('\n' + '='.repeat(70));
    console.log('📊 COMBINATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully imported: ${importedCount} new products`);
    console.log(`🔄 Updated (more detailed): ${updatedCount} existing products`);
    console.log(`⏭️  Skipped (less detailed): ${skippedCount} duplicate products`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log(`\n📈 Database counts:`);
    console.log(`   - Source DB (MONGODB_URI) before: ${sourceCount}`);
    console.log(`   - Target DB (MONGODB_URI_STAGE3) before: ${targetCount}`);
    console.log(`   - Target DB (MONGODB_URI_STAGE3) after: ${finalTargetCount}`);
    console.log(`   - Net change: +${finalTargetCount - targetCount} products`);
    console.log('='.repeat(70) + '\n');

    // Show some duplicate details if any
    if (duplicateDetails.length > 0) {
      console.log('📋 Duplicate handling details (first 10):');
      duplicateDetails.slice(0, 10).forEach((detail, idx) => {
        console.log(`   ${idx + 1}. "${detail.name}..." - ${detail.action} (${detail.type} match, scores: ${detail.sourceScore} vs ${detail.existingScore})`);
      });
      if (duplicateDetails.length > 10) {
        console.log(`   ... and ${duplicateDetails.length - 10} more`);
      }
      console.log('');
    }

    // Close connections
    await sourceConn.close();
    await targetConn.close();
    console.log('✅ Database connections closed');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
combineAllProducts()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

