/**
 * Comprehensive Product Categorization Script
 * 
 * This script analyzes all products in the main database and assigns appropriate categories
 * based on product name, description, tags, productType, and specifications.
 * 
 * Categories: Men, Women, Children, Office & Travel, Accessories, Gifting, Wool
 * 
 * Usage: node scripts/categorize-products-comprehensive.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env.local'),
});
require('dotenv').config(); // fallback to .env

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set.');
  console.error('Please ensure MONGODB_URI is set in your .env.local file.');
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define the Product schema (same as in your models)
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
    enum: ['Men', 'Women', 'Children', 'Office & Travel', 'Accessories', 'Gifting', 'Wool', 'Footwear'],
    default: 'Accessories'
  },
  brand: {
    type: String,
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
    min: [0, 'Stock count cannot be negative'],
    default: 0
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
    trim: true,
    unique: true,
    sparse: true
  },
  productType: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true,
  strict: false // Allow fields not in schema
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Category detection patterns and keywords
const categoryPatterns = {
  'Men': {
    keywords: [
      /\bmen'?s\b/i,
      /\bmens\b/i,
      /\bmen\b/i,
      /\bman'?s\b/i,
      /\bmale\b/i,
      /\bgentlemen'?s\b/i,
      /\bgentlemen\b/i,
      /\bguy'?s\b/i,
      /\bboys\b/i,
      /\bboy'?s\b/i
    ],
    productTypes: ['mens', 'men', 'male', 'gentlemen'],
    tags: ['men', 'mens', 'male', 'gentlemen', 'boys']
  },
  'Women': {
    keywords: [
      /\bwomen'?s\b/i,
      /\bwomens\b/i,
      /\bwomen\b/i,
      /\bwoman'?s\b/i,
      /\bfemale\b/i,
      /\bladies'?\b/i,
      /\blady'?s\b/i,
      /\bgirls'?\b/i,
      /\bgirl'?s\b/i
    ],
    productTypes: ['womens', 'women', 'ladies', 'female', 'girls'],
    tags: ['women', 'womens', 'ladies', 'female', 'girls']
  },
  'Children': {
    keywords: [
      /\bchildren'?s\b/i,
      /\bchildren\b/i,
      /\bchild'?s\b/i,
      /\bkids'?\b/i,
      /\bkid'?s\b/i,
      /\btoddler'?s\b/i,
      /\btoddlers\b/i,
      /\bbaby'?s\b/i,
      /\bbabies\b/i,
      /\binfant'?s\b/i,
      /\binfants\b/i,
      /\byouth\b/i,
      /\bjunior'?s\b/i,
      /\bboys\b/i,
      /\bboy'?s\b/i,
      /\bgirls'?\b/i,
      /\bgirl'?s\b/i
    ],
    productTypes: ['children', 'kids', 'toddler', 'baby', 'infant', 'youth', 'junior'],
    tags: ['children', 'kids', 'toddler', 'baby', 'infant', 'youth', 'junior']
  },
  'Wool': {
    keywords: [
      /\bwool\b/i,
      /\bwoolen\b/i,
      /\bwoollen\b/i,
      /\bmerino\s+wool\b/i,
      /\bcashmere\b/i,
      /\balpaca\b/i,
      /\bwool\s+blend\b/i,
      /\bwool\s+coat\b/i,
      /\bwool\s+jacket\b/i,
      /\bwool\s+cardigan\b/i,
      /\bwool\s+sweater\b/i
    ],
    productTypes: ['wool', 'woolen', 'woollen', 'merino', 'cashmere', 'alpaca'],
    tags: ['wool', 'woolen', 'woollen', 'merino', 'cashmere', 'alpaca']
  },
  'Office & Travel': {
    keywords: [
      /\boffice\b/i,
      /\btravel\b/i,
      /\bbriefcase\b/i,
      /\blaptop\s+bag\b/i,
      /\bluggage\b/i,
      /\bsuitcase\b/i,
      /\bbackpack\b/i,
      /\bportfolio\b/i,
      /\bwork\s+bag\b/i,
      /\bexecutive\b/i,
      /\bbusiness\s+bag\b/i,
      /\bcarry\s+on\b/i,
      /\bduffel\s+bag\b/i
    ],
    productTypes: ['office', 'travel', 'briefcase', 'luggage', 'suitcase', 'backpack'],
    tags: ['office', 'travel', 'briefcase', 'luggage', 'suitcase', 'backpack', 'business']
  },
  'Gifting': {
    keywords: [
      /\bgift\b/i,
      /\bgifting\b/i,
      /\bpresent\b/i,
      /\bgift\s+set\b/i,
      /\bgift\s+box\b/i,
      /\bholiday\s+gift\b/i,
      /\bchristmas\s+gift\b/i,
      /\banniversary\s+gift\b/i,
      /\bwedding\s+gift\b/i,
      /\bpersonalized\s+gift\b/i,
      /\bcustom\s+gift\b/i
    ],
    productTypes: ['gift', 'gifting', 'present'],
    tags: ['gift', 'gifting', 'present', 'holiday', 'christmas', 'anniversary']
  },
  'Footwear': {
    keywords: [
      /\bfootwear\b/i,
      /\bshoes\b/i,
      /\bshoe\b/i,
      /\bsneakers\b/i,
      /\bsneaker\b/i,
      /\bboots\b/i,
      /\bboot\b/i,
      /\bsandals\b/i,
      /\bsandal\b/i,
      /\bslippers\b/i,
      /\bslipper\b/i,
      /\bflip\s+flops\b/i,
      /\bflip\s+flop\b/i,
      /\bheels\b/i,
      /\bheel\b/i,
      /\bhigh\s+heels\b/i,
      /\bflats\b/i,
      /\bflat\s+shoes\b/i,
      /\brockers\b/i,
      /\brocker\b/i,
      /\bcanvas\s+shoes\b/i,
      /\bathletic\s+shoes\b/i,
      /\brunning\s+shoes\b/i,
      /\bwalking\s+shoes\b/i,
      /\bsports\s+shoes\b/i,
      /\bcasual\s+shoes\b/i,
      /\bformal\s+shoes\b/i,
      /\bdress\s+shoes\b/i,
      /\bloafers\b/i,
      /\bloafer\b/i,
      /\bclogs\b/i,
      /\bclog\b/i,
      /\bespadrilles\b/i,
      /\bespadrille\b/i,
      /\bmoccasins\b/i,
      /\bmoccasin\b/i,
      /\bwedges\b/i,
      /\bwedge\s+shoes\b/i,
      /\bpumps\b/i,
      /\bpump\s+shoes\b/i,
      /\bstilettos\b/i,
      /\bstiletto\b/i,
      /\bplatform\s+shoes\b/i,
      /\bplatforms\b/i,
      /\bcomfy\s+shoes\b/i,
      /\bcomfort\s+shoes\b/i
    ],
    productTypes: ['footwear', 'shoes', 'sneakers', 'boots', 'sandals', 'slippers', 'heels', 'flats'],
    tags: ['footwear', 'shoes', 'sneakers', 'boots', 'sandals', 'slippers', 'heels', 'flats']
  },
  'Accessories': {
    keywords: [
      /\baccessory\b/i,
      /\baccessories\b/i,
      /\bwallet\b/i,
      /\bbelt\b/i,
      /\bwatch\b/i,
      /\bgloves\b/i,
      /\bscarf\b/i,
      /\bhat\b/i,
      /\bcap\b/i,
      /\bkeychain\b/i,
      /\bphone\s+case\b/i
    ],
    productTypes: ['accessory', 'accessories'],
    tags: ['accessory', 'accessories']
  }
};

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

/**
 * Check if text matches any pattern in the category (for regex patterns)
 */
function matchesPatterns(text, patterns) {
  if (!text || !Array.isArray(patterns) || patterns.length === 0) return false;
  const normalized = normalizeText(text);
  return patterns.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(normalized);
    }
    return false;
  });
}

/**
 * Check if any value in array matches string values (for productTypes and tags)
 */
function matchesStringArray(array, stringArray) {
  if (!Array.isArray(array) || array.length === 0) return false;
  if (!Array.isArray(stringArray) || stringArray.length === 0) return false;
  
  const normalizedArray = array.map(item => normalizeText(String(item)));
  const normalizedStringArray = stringArray.map(item => normalizeText(String(item)));
  
  return normalizedArray.some(item => 
    normalizedStringArray.some(str => item.includes(str) || str.includes(item))
  );
}

/**
 * Determine category for a product based on multiple factors
 */
function determineCategory(product) {
  const searchText = [
    product.name || '',
    product.description || '',
    product.productType || '',
    ...(product.tags || []),
    ...(product.specifications ? Object.values(product.specifications) : [])
  ].join(' ').toLowerCase();

  // Priority order: Footwear > Children > Wool > Men/Women > Office & Travel > Gifting > Accessories
  // Check Footwear first (very specific product type)
  if (matchesPatterns(searchText, categoryPatterns['Footwear'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Footwear'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Footwear'].tags)) {
    return 'Footwear';
  }

  // Check Children (most specific demographic)
  if (matchesPatterns(searchText, categoryPatterns['Children'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Children'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Children'].tags)) {
    // But exclude if it's clearly for adults (men's/women's)
    const hasAdultGender = matchesPatterns(searchText, [
      ...categoryPatterns['Men'].keywords,
      ...categoryPatterns['Women'].keywords
    ]);
    if (!hasAdultGender) {
      return 'Children';
    }
  }

  // Check Wool (material-based category)
  if (matchesPatterns(searchText, categoryPatterns['Wool'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Wool'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Wool'].tags)) {
    return 'Wool';
  }

  // Check Women (before Men to avoid misclassification)
  if (matchesPatterns(searchText, categoryPatterns['Women'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Women'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Women'].tags)) {
    return 'Women';
  }

  // Check Men
  if (matchesPatterns(searchText, categoryPatterns['Men'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Men'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Men'].tags)) {
    return 'Men';
  }

  // Check Office & Travel
  if (matchesPatterns(searchText, categoryPatterns['Office & Travel'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Office & Travel'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Office & Travel'].tags)) {
    return 'Office & Travel';
  }

  // Check Gifting
  if (matchesPatterns(searchText, categoryPatterns['Gifting'].keywords) ||
      matchesStringArray([product.productType], categoryPatterns['Gifting'].productTypes) ||
      matchesStringArray(product.tags || [], categoryPatterns['Gifting'].tags)) {
    return 'Gifting';
  }

  // Default to Accessories
  return 'Accessories';
}

/**
 * Main categorization function
 */
async function categorizeProducts() {
  try {
    console.log('🚀 Starting comprehensive product categorization...\n');

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📊 Found ${allProducts.length} products to categorize\n`);

    if (allProducts.length === 0) {
      console.log('❌ No products found in database');
      return;
    }

    // Statistics
    const stats = {
      total: allProducts.length,
      updated: 0,
      unchanged: 0,
      errors: 0,
      categoryCounts: {},
      changes: []
    };

    // Process each product
    console.log('🔄 Processing products...\n');
    let processed = 0;

    for (const product of allProducts) {
      try {
        const currentCategory = product.category || 'Accessories';
        const newCategory = determineCategory(product);

        if (currentCategory !== newCategory) {
          // Update product category
          await Product.findByIdAndUpdate(
            product._id,
            { $set: { category: newCategory } },
            { runValidators: true }
          );

          stats.updated++;
          stats.changes.push({
            name: product.name.substring(0, 60),
            oldCategory: currentCategory,
            newCategory: newCategory
          });

          // Track category counts
          stats.categoryCounts[newCategory] = (stats.categoryCounts[newCategory] || 0) + 1;
        } else {
          stats.unchanged++;
          stats.categoryCounts[currentCategory] = (stats.categoryCounts[currentCategory] || 0) + 1;
        }

        processed++;
        if (processed % 100 === 0) {
          console.log(`   Processed ${processed}/${allProducts.length} products...`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`❌ Error processing product ${product._id}:`, error.message);
      }
    }

    // Get final category distribution
    const finalCategoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Product categorization completed!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${stats.total}`);
    console.log(`   ✅ Updated: ${stats.updated}`);
    console.log(`   ➖ Unchanged: ${stats.unchanged}`);
    console.log(`   ❌ Errors: ${stats.errors}`);

    console.log(`\n📈 Final Category Distribution:`);
    finalCategoryCounts.forEach(cat => {
      const percentage = ((cat.count / stats.total) * 100).toFixed(1);
      console.log(`   • ${cat._id || 'null'}: ${cat.count} products (${percentage}%)`);
    });

    // Show sample changes
    if (stats.changes.length > 0) {
      console.log(`\n🔄 Sample Category Changes (showing first 20):`);
      stats.changes.slice(0, 20).forEach(change => {
        console.log(`   • "${change.name}"`);
        console.log(`     ${change.oldCategory} → ${change.newCategory}`);
      });
      if (stats.changes.length > 20) {
        console.log(`   ... and ${stats.changes.length - 20} more changes`);
      }
    }

    // Show sample products from each category
    console.log(`\n📋 Sample Products by Category:`);
    for (const categoryCount of finalCategoryCounts) {
      const category = categoryCount._id;
      const sampleProducts = await Product.find({ category: category }).limit(3);
      if (sampleProducts.length > 0) {
        console.log(`\n   ${category} (${categoryCount.count} products):`);
        sampleProducts.forEach(p => {
          console.log(`     • ${p.name.substring(0, 60)}`);
          if (p.productType) {
            console.log(`       Type: ${p.productType}`);
          }
        });
      }
    }

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error during categorization:', error);
    throw error;
  }
}

// Run the script
connectDB()
  .then(() => categorizeProducts())
  .then(() => {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    mongoose.connection.close();
    process.exit(1);
  });

