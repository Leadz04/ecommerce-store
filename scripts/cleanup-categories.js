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

// Define the allowed categories
const ALLOWED_CATEGORIES = [
  'Men',
  'Women', 
  'Office & Travel',
  'Accessories',
  'Gifting'
];

// Category mapping for existing products
const CATEGORY_MAPPING = {
  'Leather Goods': 'Men',
  'Electronics': 'Accessories',
  'Clothing': 'Women',
  'Home & Kitchen': 'Office & Travel',
  'Food & Beverage': 'Gifting',
  'Sports & Outdoors': 'Men',
  'Books': 'Office & Travel',
  'Other': 'Accessories'
};

async function cleanupCategories() {
  try {
    console.log('🚀 Starting category cleanup...');
    
    // Get the Product model
    const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // First, let's see what categories currently exist
    const currentCategories = await Product.distinct('category');
    console.log('📊 Current categories in database:', currentCategories);
    
    // Count products in each category
    const categoryCounts = {};
    for (const category of currentCategories) {
      const count = await Product.countDocuments({ category });
      categoryCounts[category] = count;
    }
    console.log('📈 Products per category:', categoryCounts);
    
    // Update products to map old categories to new ones
    console.log('🔄 Mapping old categories to new ones...');
    
    for (const [oldCategory, newCategory] of Object.entries(CATEGORY_MAPPING)) {
      const result = await Product.updateMany(
        { category: oldCategory },
        { $set: { category: newCategory } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Mapped ${result.modifiedCount} products from "${oldCategory}" to "${newCategory}"`);
      }
    }
    
    // Handle any products that don't have allowed categories
    const productsToUpdate = await Product.countDocuments({
      category: { $nin: ALLOWED_CATEGORIES }
    });
    
    if (productsToUpdate > 0) {
      console.log(`⚠️  Found ${productsToUpdate} products with non-allowed categories`);
      
      // Show what categories these products have
      const nonAllowedCategories = await Product.distinct('category', {
        category: { $nin: ALLOWED_CATEGORIES }
      });
      console.log('❌ Non-allowed categories found:', nonAllowedCategories);
      
      // Update them to a default category
      const updateResult = await Product.updateMany(
        { category: { $nin: ALLOWED_CATEGORIES } },
        { $set: { category: 'Accessories' } }
      );
      console.log(`✅ Updated ${updateResult.modifiedCount} products to "Accessories" category`);
    }
    
    // Final verification
    const finalCategories = await Product.distinct('category');
    console.log('✅ Final categories in database:', finalCategories);
    
    const finalCounts = {};
    for (const category of finalCategories) {
      const count = await Product.countDocuments({ category });
      finalCounts[category] = count;
    }
    console.log('📊 Final products per category:', finalCounts);
    
    // Verify all categories are allowed
    const invalidCategories = finalCategories.filter(cat => !ALLOWED_CATEGORIES.includes(cat));
    if (invalidCategories.length > 0) {
      console.log('⚠️  Warning: Some invalid categories still exist:', invalidCategories);
    } else {
      console.log('🎉 All categories are now valid!');
    }
    
    console.log('🎉 Category cleanup completed successfully!');
    console.log('📝 Allowed categories:', ALLOWED_CATEGORIES);
    
    // Show summary
    console.log('\n📋 SUMMARY:');
    console.log('===========');
    ALLOWED_CATEGORIES.forEach(category => {
      const count = finalCounts[category] || 0;
      console.log(`• ${category}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error during category cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
connectDB().then(() => {
  cleanupCategories();
});