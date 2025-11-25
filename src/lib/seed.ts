import connectDB from './mongodb';
import Product from '@/models/Product';

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    
    console.log('Database cleared. No static products to seed.');
    console.log('Please use the product import scripts to add products to the database.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
