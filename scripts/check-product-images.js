const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const ProductSchema = new mongoose.Schema({
  name: String,
  image: String,
  images: [String],
  createdAt: Date
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkProductImages() {
  try {
    await connectDB();
    
    console.log('🔍 Checking all products for image status...\n');
    
    const allProducts = await Product.find({ isActive: true }).lean();
    
    console.log(`Total active products: ${allProducts.length}\n`);
    
    const demoImages = allProducts.filter(p => 
      p.image && (
        p.image.includes('res.cloudinary.com/demo') ||
        p.image.includes('images.unsplash.com')
      )
    );
    
    const cloudinaryImages = allProducts.filter(p => 
      p.image && 
      p.image.includes('cloudinary.com') &&
      !p.image.includes('res.cloudinary.com/demo')
    );
    
    const otherImages = allProducts.filter(p => 
      p.image && 
      !p.image.includes('cloudinary.com') &&
      !p.image.includes('images.unsplash.com') &&
      !p.image.includes('res.cloudinary.com/demo')
    );
    
    console.log('📊 Image Statistics:');
    console.log(`   Products with demo/unsplash images: ${demoImages.length}`);
    console.log(`   Products with Cloudinary images: ${cloudinaryImages.length}`);
    console.log(`   Products with other image sources: ${otherImages.length}`);
    
    if (demoImages.length > 0) {
      console.log(`\n⚠️  Products with demo/unsplash images (${demoImages.length}):`);
      demoImages.slice(0, 10).forEach(p => {
        console.log(`   - ${p.name}: ${p.image.substring(0, 80)}...`);
      });
      if (demoImages.length > 10) {
        console.log(`   ... and ${demoImages.length - 10} more`);
      }
    }
    
    if (cloudinaryImages.length > 0) {
      console.log(`\n✅ Products with Cloudinary images (showing first 5):`);
      cloudinaryImages.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name}: ${p.image.substring(0, 80)}...`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

checkProductImages();

