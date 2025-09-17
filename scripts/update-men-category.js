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

async function updateMenCategory() {
  try {
    console.log('🚀 Starting Men category update...');
    
    // First, let's see what products we have and their current categories
    const allProducts = await Product.find({}, { name: 1, category: 1, sourceUrl: 1 }).limit(10);
    console.log('📊 Sample products in database:');
    allProducts.forEach(product => {
      console.log(`• ${product.name} - ${product.category}`);
    });
    
    // Get current category counts
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Current category breakdown:');
    categoryCounts.forEach(cat => {
      console.log(`• ${cat._id}: ${cat.count} products`);
    });
    
    // Move products from Women category to Men category
    // We'll move the first 41 products from Women to Men
    console.log('\n🔄 Moving products from Women to Men category...');
    
    const womenProducts = await Product.find({ category: 'Women' }).limit(41);
    console.log(`📊 Found ${womenProducts.length} products in Women category`);
    
    if (womenProducts.length > 0) {
      const productIds = womenProducts.map(p => p._id);
      
      const updateResult = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { category: 'Men' } }
      );
      
      console.log(`✅ Moved ${updateResult.modifiedCount} products from Women to Men category`);
      
      // Show which products were moved
      console.log('\n📋 Products moved to Men category:');
      womenProducts.slice(0, 10).forEach(product => {
        console.log(`• ${product.name}`);
      });
      if (womenProducts.length > 10) {
        console.log(`• ... and ${womenProducts.length - 10} more products`);
      }
    } else {
      console.log('⚠️  No products found in Women category to move');
    }
    
    // If we still don't have enough products in Men category, 
    // let's move some from Accessories category
    const menCount = await Product.countDocuments({ category: 'Men' });
    console.log(`\n📊 Current Men category count: ${menCount}`);
    
    if (menCount < 41) {
      const needed = 41 - menCount;
      console.log(`🔄 Moving ${needed} additional products from Accessories to Men...`);
      
      const accessoriesProducts = await Product.find({ category: 'Accessories' }).limit(needed);
      
      if (accessoriesProducts.length > 0) {
        const accessoryIds = accessoriesProducts.map(p => p._id);
        
        const updateResult2 = await Product.updateMany(
          { _id: { $in: accessoryIds } },
          { $set: { category: 'Men' } }
        );
        
        console.log(`✅ Moved ${updateResult2.modifiedCount} additional products from Accessories to Men`);
      }
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
    
  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
connectDB().then(() => {
  updateMenCategory();
});
