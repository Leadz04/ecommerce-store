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
    trim: true,
    default: 'Wolveyes'
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
  variants: [{
    name: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    available: { type: Boolean, default: true },
    inventory: { type: Number, default: 0 }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function ensureMenProducts() {
  try {
    console.log('🚀 Ensuring Men category has 41 products...');
    
    // Get current category counts
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📈 Current category breakdown:');
    categoryCounts.forEach(cat => {
      console.log(`• ${cat._id}: ${cat.count} products`);
    });
    
    const menCount = await Product.countDocuments({ category: 'Men' });
    console.log(`\n📊 Current Men category count: ${menCount}`);
    
    if (menCount < 41) {
      const needed = 41 - menCount;
      console.log(`🔄 Need to move ${needed} more products to Men category...`);
      
      // Try to move from Accessories first
      const accessoriesProducts = await Product.find({ category: 'Accessories' }).limit(needed);
      console.log(`📊 Found ${accessoriesProducts.length} products in Accessories category`);
      
      if (accessoriesProducts.length > 0) {
        const accessoryIds = accessoriesProducts.map(p => p._id);
        
        const updateResult = await Product.updateMany(
          { _id: { $in: accessoryIds } },
          { $set: { category: 'Men' } }
        );
        
        console.log(`✅ Moved ${updateResult.modifiedCount} products from Accessories to Men`);
        
        // Show which products were moved
        console.log('\n📋 Products moved to Men category:');
        accessoriesProducts.slice(0, 10).forEach(product => {
          console.log(`• ${product.name}`);
        });
        if (accessoriesProducts.length > 10) {
          console.log(`• ... and ${accessoriesProducts.length - 10} more products`);
        }
      }
      
      // Check if we still need more products
      const newMenCount = await Product.countDocuments({ category: 'Men' });
      const stillNeeded = 41 - newMenCount;
      
      if (stillNeeded > 0) {
        console.log(`\n🔄 Still need ${stillNeeded} more products. Checking other categories...`);
        
        // Try to move from other categories
        const otherProducts = await Product.find({ 
          category: { $in: ['Office & Travel', 'Gifting'] } 
        }).limit(stillNeeded);
        
        if (otherProducts.length > 0) {
          const otherIds = otherProducts.map(p => p._id);
          
          const updateResult2 = await Product.updateMany(
            { _id: { $in: otherIds } },
            { $set: { category: 'Men' } }
          );
          
          console.log(`✅ Moved ${updateResult2.modifiedCount} additional products to Men`);
        }
      }
    } else if (menCount > 41) {
      console.log(`⚠️  Men category has ${menCount} products, which is more than the target of 41`);
    } else {
      console.log(`✅ Men category already has exactly 41 products`);
    }
    
    // Final verification
    const finalCategoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🎉 Men category update completed!');
    console.log('=====================================');
    console.log('📈 Final category breakdown:');
    finalCategoryCounts.forEach(cat => {
      console.log(`• ${cat._id}: ${cat.count} products`);
    });
    
    const finalMenCount = await Product.countDocuments({ category: 'Men' });
    console.log(`\n✅ Men category now has ${finalMenCount} products`);
    
    if (finalMenCount >= 41) {
      console.log('🎯 Target achieved! Men category has 41+ products');
    } else {
      console.log(`⚠️  Men category has ${finalMenCount} products, still need ${41 - finalMenCount} more`);
    }
    
  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
connectDB().then(() => {
  ensureMenProducts();
});
