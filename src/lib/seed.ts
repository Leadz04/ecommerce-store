import connectDB from './mongodb';
import Product from '@/models/Product';

const products = [
  // Leather Goods
  {
    name: 'Premium Leather Jacket - Men\'s',
    description: 'Classic brown leather jacket crafted from genuine cowhide. Features a timeless design with multiple pockets and a comfortable fit. Perfect for casual and semi-formal occasions.',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1591047139820-dc7fd73f61a3?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'LeatherCraft',
    rating: 4.8,
    reviewCount: 156,
    inStock: true,
    stockCount: 12,
    tags: ['leather', 'jacket', 'mens', 'premium', 'brown'],
    specifications: {
      'Material': '100% Genuine Cowhide Leather',
      'Lining': 'Polyester',
      'Closure': 'Zipper',
      'Pockets': '4 Exterior, 2 Interior',
      'Sizes': 'S, M, L, XL, XXL'
    }
  },
  {
    name: 'Elegant Leather Handbag - Women\'s',
    description: 'Sophisticated black leather handbag with gold hardware. Features multiple compartments, adjustable strap, and premium Italian leather construction.',
    price: 189.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'LuxuryLeather',
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    stockCount: 8,
    tags: ['leather', 'handbag', 'womens', 'elegant', 'black'],
    specifications: {
      'Material': 'Italian Genuine Leather',
      'Hardware': 'Gold-tone',
      'Dimensions': '12" x 8" x 4"',
      'Strap': 'Adjustable, 24" drop',
      'Interior': '2 main compartments, 1 zipper pocket'
    }
  },
  {
    name: 'Classic Leather Wallet - Men\'s',
    description: 'Slim bifold leather wallet with RFID blocking technology. Handcrafted from premium leather with multiple card slots and cash compartment.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'CraftLeather',
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
    stockCount: 45,
    tags: ['leather', 'wallet', 'mens', 'rfid', 'bifold'],
    specifications: {
      'Material': 'Premium Genuine Leather',
      'RFID Protection': 'Yes',
      'Card Slots': '8',
      'Cash Compartment': 'Yes',
      'Dimensions': '4.5" x 3.5"'
    }
  },
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 199.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
    ],
    category: 'Electronics',
    brand: 'SoundMax',
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
    stockCount: 25,
    tags: ['wireless', 'bluetooth', 'noise-cancellation', 'premium'],
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Color': 'Black'
    }
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitoring, GPS, and water resistance. Track your health and fitness goals.',
    price: 299.99,
    originalPrice: 349.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500&h=500&fit=crop'
    ],
    category: 'Electronics',
    brand: 'FitTech',
    rating: 4.3,
    reviewCount: 89,
    inStock: true,
    stockCount: 15,
    tags: ['fitness', 'smartwatch', 'health', 'gps'],
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery Life': '7 days',
      'Water Resistance': '5ATM',
      'Sensors': 'Heart Rate, GPS, Accelerometer'
    }
  },
  // Clothing
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop'
    ],
    category: 'Clothing',
    brand: 'EcoWear',
    rating: 4.7,
    reviewCount: 203,
    inStock: true,
    stockCount: 50,
    tags: ['organic', 'cotton', 'sustainable', 'casual'],
    specifications: {
      'Material': '100% Organic Cotton',
      'Care': 'Machine Wash Cold',
      'Origin': 'Fair Trade Certified',
      'Colors': 'White, Black, Navy, Gray'
    }
  },
  {
    name: 'Denim Jeans - Classic Fit',
    description: 'Classic fit denim jeans made from premium cotton denim. Comfortable, durable, and stylish for everyday wear.',
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1506629905607-1b0a0a0a0a0a?w=500&h=500&fit=crop'
    ],
    category: 'Clothing',
    brand: 'DenimCo',
    rating: 4.4,
    reviewCount: 187,
    inStock: true,
    stockCount: 35,
    tags: ['denim', 'jeans', 'classic-fit', 'cotton'],
    specifications: {
      'Material': '98% Cotton, 2% Elastane',
      'Fit': 'Classic',
      'Wash': 'Medium Blue',
      'Sizes': '28-38',
      'Care': 'Machine Wash Cold'
    }
  }
];

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
