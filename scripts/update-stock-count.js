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

// Define the Product schema (minimal, just what we need)
const ProductSchema = new mongoose.Schema({
  name: { type: String },
  stockCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  strict: false // Allow other fields to exist without defining them
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function updateStockCount() {
  try {
    console.log('🚀 Starting stock count update...');
    
    // Get total count of products
    const totalProducts = await Product.countDocuments({});
    console.log(`📊 Total products in database: ${totalProducts}`);
    
    if (totalProducts === 0) {
      console.log('⚠️  No products found in database');
      return;
    }
    
    // Update all products' stockCount to 7
    console.log('\n🔄 Updating stock count to 7 for all products...');
    const updateResult = await Product.updateMany(
      {}, // Empty filter means all products
      { $set: { stockCount: 7 } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} products`);
    console.log(`📊 Matched ${updateResult.matchedCount} products`);
    
    // Verify the update
    const productsWithStock7 = await Product.countDocuments({ stockCount: 7 });
    console.log(`\n✅ Verification: ${productsWithStock7} products now have stockCount = 7`);
    
    // Show a sample of updated products
    const sampleProducts = await Product.find({}, { name: 1, stockCount: 1 }).limit(5);
    console.log('\n📋 Sample of updated products:');
    sampleProducts.forEach(product => {
      console.log(`• ${product.name}: stockCount = ${product.stockCount}`);
    });
    
    console.log('\n🎉 Stock count update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during update:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
connectDB().then(() => {
  updateStockCount().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
});

