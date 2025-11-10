const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
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
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
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
  isActive: {
    type: Boolean,
    default: true
  },
  productType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Gender detection keywords - using word boundaries for better matching
// Check women first since they're more specific and should take priority
const womenPatterns = [
  /\bwomen'?s\b/i,  // Women's or Womens
  /\bwomens\b/i,    // Womens
  /\bwomen\b/i,     // Women
  /\bladies\b/i,    // Ladies
  /\blady\b/i,      // Lady
  /\bfemale\b/i     // Female
];

const menPatterns = [
  /\bmens\b/i,      // Mens
  /\bmen'?s\b/i,    // Men's or Mens
  /\bmen\b/i,       // Men
  /\bman\b/i,       // Man (but not in "woman")
  /\bmale\b/i       // Male
];

// Product type patterns - ordered by specificity (more specific first)
const productTypePatterns = [
  // Suede products
  { pattern: /\bsuede\s+jacket\b/i, type: 'Suede Jacket' },
  { pattern: /\bsuede\s+coat\b/i, type: 'Suede Coat' },
  { pattern: /\bsuede\s+vest\b/i, type: 'Suede Vest' },
  { pattern: /\bsuede\b/i, type: 'Suede' },
  
  // Leather jacket types
  { pattern: /\bcafe\s+racer\s+leather\s+jacket\b/i, type: 'Cafe Racer Leather Jacket' },
  { pattern: /\bbiker\s+leather\s+jacket\b/i, type: 'Biker Leather Jacket' },
  { pattern: /\bleather\s+biker\s+jacket\b/i, type: 'Biker Leather Jacket' },
  { pattern: /\bquilted\s+leather\s+jacket\b/i, type: 'Quilted Leather Jacket' },
  { pattern: /\basymmetrical\s+leather\s+jacket\b/i, type: 'Asymmetrical Leather Jacket' },
  { pattern: /\bbelted\s+leather\s+jacket\b/i, type: 'Belted Leather Jacket' },
  { pattern: /\breal\s+leather\s+jacket\b/i, type: 'Real Leather Jacket' },
  { pattern: /\bsoft\s+leather\s+jacket\b/i, type: 'Soft Leather Jacket' },
  { pattern: /\blambskin\s+leather\s+jacket\b/i, type: 'Lambskin Leather Jacket' },
  { pattern: /\bleather\s+jacket\b/i, type: 'Leather Jacket' },
  { pattern: /\bleather\s+coat\b/i, type: 'Leather Coat' },
  { pattern: /\bleather\s+vest\b/i, type: 'Leather Vest' },
  { pattern: /\bleather\b/i, type: 'Leather' },
  
  // Jacket types
  { pattern: /\bbomber\s+jacket\b/i, type: 'Bomber Jacket' },
  { pattern: /\bdenim\s+jacket\b/i, type: 'Denim Jacket' },
  { pattern: /\bquilted\s+jacket\b/i, type: 'Quilted Jacket' },
  { pattern: /\bhooded\s+jacket\b/i, type: 'Hooded Jacket' },
  { pattern: /\bzip\s+up\s+jacket\b/i, type: 'Zip Up Jacket' },
  { pattern: /\bjacket\b/i, type: 'Jacket' },
  
  // Coat types
  { pattern: /\bwool\s+coat\b/i, type: 'Wool Coat' },
  { pattern: /\bovercoat\b/i, type: 'Overcoat' },
  { pattern: /\bcoat\b/i, type: 'Coat' },
  
  // Vest types
  { pattern: /\bleather\s+vest\b/i, type: 'Leather Vest' },
  { pattern: /\bvest\b/i, type: 'Vest' },
  
  // Other clothing items
  { pattern: /\bshirt\b/i, type: 'Shirt' },
  { pattern: /\bpants\b/i, type: 'Pants' },
  { pattern: /\btrousers\b/i, type: 'Trousers' },
  { pattern: /\bjeans\b/i, type: 'Jeans' },
  { pattern: /\bshorts\b/i, type: 'Shorts' },
];

function detectGender(title) {
  if (!title || typeof title !== 'string') {
    return null;
  }
  
  // Check for women keywords FIRST (they should take priority)
  // This ensures "Women's" products don't get misclassified
  for (const pattern of womenPatterns) {
    if (pattern.test(title)) {
      return 'Women';
    }
  }
  
  // Then check for men keywords
  // Use word boundaries to avoid matching "woman" when looking for "man"
  for (const pattern of menPatterns) {
    if (pattern.test(title)) {
      // Double-check: if title also contains women keywords, prioritize women
      let hasWomenKeyword = false;
      for (const womenPattern of womenPatterns) {
        if (womenPattern.test(title)) {
          hasWomenKeyword = true;
          break;
        }
      }
      if (!hasWomenKeyword) {
        return 'Men';
      }
    }
  }
  
  // No gender detected
  return null;
}

function detectProductType(title) {
  const lowerTitle = title.toLowerCase();
  
  // Try to match patterns in order of specificity
  for (const { pattern, type } of productTypePatterns) {
    if (pattern.test(title)) {
      return type;
    }
  }
  
  // If no specific pattern matches, try to extract common words
  const words = title.toLowerCase().split(/\s+/);
  const productWords = ['jacket', 'coat', 'vest', 'shirt', 'pants', 'trousers', 'jeans', 'shorts'];
  
  for (const word of words) {
    if (productWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  
  return null;
}

async function categorizeByTitle() {
  try {
    console.log('🚀 Starting product categorization by title...');
    
    const allProducts = await Product.find({});
    console.log(`📊 Found ${allProducts.length} products to categorize`);
    
    let menCount = 0;
    let womenCount = 0;
    let unchangedCount = 0;
    let updatedCount = 0;
    const categoryStats = {};
    const productTypeStats = {};
    const recategorizedProducts = [];
    
    for (const product of allProducts) {
      const title = product.name || '';
      const detectedGender = detectGender(title);
      const detectedProductType = detectProductType(title);
      
      const updates = {};
      let needsUpdate = false;
      
      // Update category if gender detected - FORCE update to ensure correct categorization
      if (detectedGender) {
        const oldCategory = product.category || 'Unknown';
        // Always update to detected gender, even if it's already set
        // This ensures products are correctly recategorized
        updates.category = detectedGender;
        needsUpdate = true;
        
        if (oldCategory !== detectedGender) {
          recategorizedProducts.push({
            name: title.substring(0, 60),
            oldCategory: oldCategory,
            newCategory: detectedGender
          });
        }
        
        if (detectedGender === 'Men') {
          if (product.category !== 'Men') menCount++;
        } else if (detectedGender === 'Women') {
          if (product.category !== 'Women') womenCount++;
        }
      }
      
      // Update productType if detected
      if (detectedProductType) {
        if (product.productType !== detectedProductType) {
          updates.productType = detectedProductType;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, { $set: updates });
        updatedCount++;
        
        // Track stats
        const category = updates.category || product.category;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
        
        if (detectedProductType) {
          productTypeStats[detectedProductType] = (productTypeStats[detectedProductType] || 0) + 1;
        }
      } else {
        unchangedCount++;
        const category = product.category || 'Unknown';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      }
    }
    
    // Final verification
    const finalCategoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🎉 Product categorization completed!');
    console.log('=====================================');
    console.log(`✅ Updated: ${updatedCount} products`);
    console.log(`➖ Unchanged: ${unchangedCount} products`);
    console.log(`👔 Assigned to Men: ${menCount} products`);
    console.log(`👗 Assigned to Women: ${womenCount} products`);
    
    // Show some recategorized products
    if (recategorizedProducts.length > 0) {
      console.log(`\n🔄 Recategorized ${recategorizedProducts.length} products:`);
      recategorizedProducts.slice(0, 20).forEach(p => {
        console.log(`  • "${p.name}"`);
        console.log(`    ${p.oldCategory} → ${p.newCategory}`);
      });
      if (recategorizedProducts.length > 20) {
        console.log(`  ... and ${recategorizedProducts.length - 20} more`);
      }
    }
    
    console.log('\n📈 Final Category Breakdown:');
    finalCategoryCounts.forEach(cat => {
      console.log(`• ${cat._id || 'null'}: ${cat.count} products`);
    });
    
    if (Object.keys(productTypeStats).length > 0) {
      console.log('\n📋 Product Type Distribution (Top 10):');
      const sortedTypes = Object.entries(productTypeStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      sortedTypes.forEach(([type, count]) => {
        console.log(`• ${type}: ${count} products`);
      });
    }
    
    // Show some sample categorized products
    console.log('\n📋 Sample categorized products:');
    const menProducts = await Product.find({ category: 'Men' }).limit(5);
    const womenProducts = await Product.find({ category: 'Women' }).limit(5);
    
    if (menProducts.length > 0) {
      console.log('\n👔 Men\'s Products:');
      menProducts.forEach(p => {
        console.log(`  • ${p.name}`);
        console.log(`    Category: ${p.category}, Type: ${p.productType || 'N/A'}`);
      });
    }
    
    if (womenProducts.length > 0) {
      console.log('\n👗 Women\'s Products:');
      womenProducts.forEach(p => {
        console.log(`  • ${p.name}`);
        console.log(`    Category: ${p.category}, Type: ${p.productType || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during categorization:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the categorization
connectDB().then(() => {
  categorizeByTitle();
});

