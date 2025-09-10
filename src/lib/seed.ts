import connectDB from './mongodb';
import Product from '@/models/Product';
import { sampleProducts } from '@/data/products';

const products = sampleProducts;

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    
    // Insert new products
    await Product.insertMany(products);
    
    console.log('Database seeded successfully with', products.length, 'products');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
