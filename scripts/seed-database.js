const { MongoClient } = require('mongodb');
const products = require('../src/lib/seed.ts');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI environment variable');
  process.exit(1);
}

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert sample products
    const result = await productsCollection.insertMany(products.products);
    console.log(`Inserted ${result.insertedCount} products`);
    
    // Create indexes
    await productsCollection.createIndex({ name: 'text', description: 'text', tags: 'text' });
    await productsCollection.createIndex({ category: 1 });
    await productsCollection.createIndex({ brand: 1 });
    await productsCollection.createIndex({ price: 1 });
    await productsCollection.createIndex({ rating: -1 });
    console.log('Created indexes');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();
