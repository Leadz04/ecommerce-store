import { Product } from '@/types';

export const sampleProducts: Product[] = [
  // Leather Goods (12 products)
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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
  {
    id: '4',
    name: 'Leather Laptop Bag - Business',
    description: 'Professional leather laptop bag designed for business professionals. Fits laptops up to 15.6", multiple compartments, and padded shoulder strap.',
    price: 199.99,
    originalPrice: 279.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'ProLeather',
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
    stockCount: 15,
    tags: ['leather', 'laptop-bag', 'business', 'professional', 'brown'],
    specifications: {
      'Laptop Size': 'Up to 15.6"',
      'Material': 'Genuine Leather',
      'Compartments': '3 Main + 2 Side',
      'Strap': 'Adjustable, Padded',
      'Dimensions': '16" x 12" x 4"'
    }
  },
  {
    id: '5',
    name: 'Leather Travel Bag - Unisex',
    description: 'Spacious leather travel bag perfect for weekend getaways. Features multiple compartments, durable construction, and comfortable handles.',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'TravelLeather',
    rating: 4.4,
    reviewCount: 43,
    inStock: true,
    stockCount: 10,
    tags: ['leather', 'travel-bag', 'unisex', 'weekend', 'spacious'],
    specifications: {
      'Capacity': '40L',
      'Material': 'Full Grain Leather',
      'Compartments': '2 Main + 4 Side',
      'Handles': 'Leather wrapped',
      'Dimensions': '20" x 14" x 8"'
    }
  },
  {
    id: '6',
    name: 'Leather Belt - Men\'s',
    description: 'Classic leather belt with brass buckle. Made from genuine leather with a timeless design that complements both casual and formal attire.',
    price: 49.99,
    originalPrice: 69.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'BeltCraft',
    rating: 4.6,
    reviewCount: 178,
    inStock: true,
    stockCount: 35,
    tags: ['leather', 'belt', 'mens', 'brass-buckle', 'classic'],
    specifications: {
      'Material': 'Genuine Leather',
      'Buckle': 'Brass',
      'Width': '1.5"',
      'Sizes': '32", 34", 36", 38", 40", 42"',
      'Finish': 'Natural'
    }
  },
  {
    id: '7',
    name: 'Leather Gift Set - Premium',
    description: 'Elegant leather gift set including wallet, keychain, and business card holder. Perfect for corporate gifts or special occasions.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'GiftLeather',
    rating: 4.8,
    reviewCount: 92,
    inStock: true,
    stockCount: 20,
    tags: ['leather', 'gift-set', 'premium', 'corporate', 'elegant'],
    specifications: {
      'Contents': 'Wallet, Keychain, Business Card Holder',
      'Material': 'Premium Leather',
      'Packaging': 'Gift Box Included',
      'Personalization': 'Available',
      'Colors': 'Black, Brown, Tan'
    }
  },
  {
    id: '8',
    name: 'Leather Jacket - Women\'s',
    description: 'Stylish women\'s leather jacket with a modern cut. Features a cropped design, zipper closure, and multiple pockets. Perfect for layering.',
    price: 219.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'StyleLeather',
    rating: 4.5,
    reviewCount: 76,
    inStock: true,
    stockCount: 14,
    tags: ['leather', 'jacket', 'womens', 'stylish', 'cropped'],
    specifications: {
      'Material': 'Genuine Leather',
      'Style': 'Cropped',
      'Closure': 'Zipper',
      'Pockets': '2 Exterior, 1 Interior',
      'Sizes': 'XS, S, M, L, XL'
    }
  },
  {
    id: '9',
    name: 'Leather Backpack - Student',
    description: 'Durable leather backpack designed for students and professionals. Features laptop compartment, multiple pockets, and comfortable straps.',
    price: 159.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'StudentLeather',
    rating: 4.3,
    reviewCount: 134,
    inStock: true,
    stockCount: 22,
    tags: ['leather', 'backpack', 'student', 'laptop', 'durable'],
    specifications: {
      'Laptop Compartment': 'Up to 15.6"',
      'Material': 'Genuine Leather',
      'Capacity': '25L',
      'Straps': 'Padded, Adjustable',
      'Pockets': '3 Main + 2 Side'
    }
  },
  {
    id: '10',
    name: 'Leather Watch Strap - Unisex',
    description: 'Premium leather watch strap compatible with most watch brands. Handcrafted from genuine leather with a classic design.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'WatchLeather',
    rating: 4.7,
    reviewCount: 201,
    inStock: true,
    stockCount: 50,
    tags: ['leather', 'watch-strap', 'unisex', 'premium', 'classic'],
    specifications: {
      'Material': 'Genuine Leather',
      'Width': '20mm, 22mm, 24mm',
      'Length': 'Adjustable',
      'Buckle': 'Stainless Steel',
      'Colors': 'Black, Brown, Tan'
    }
  },
  {
    id: '11',
    name: 'Leather Phone Case - Premium',
    description: 'Luxurious leather phone case with card slots and wireless charging compatibility. Handcrafted from premium leather with a slim profile.',
    price: 69.99,
    originalPrice: 89.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'PhoneLeather',
    rating: 4.4,
    reviewCount: 87,
    inStock: true,
    stockCount: 30,
    tags: ['leather', 'phone-case', 'premium', 'card-slots', 'wireless-charging'],
    specifications: {
      'Compatibility': 'iPhone 14, 13, 12 series',
      'Material': 'Premium Leather',
      'Card Slots': '3',
      'Wireless Charging': 'Compatible',
      'Colors': 'Black, Brown, Navy'
    }
  },
  {
    id: '12',
    name: 'Leather Desk Organizer - Office',
    description: 'Elegant leather desk organizer with multiple compartments for pens, business cards, and small items. Perfect for home office or corporate desk.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Leather Goods',
    brand: 'OfficeLeather',
    rating: 4.6,
    reviewCount: 45,
    inStock: true,
    stockCount: 18,
    tags: ['leather', 'desk-organizer', 'office', 'elegant', 'storage'],
    specifications: {
      'Material': 'Genuine Leather',
      'Compartments': '6',
      'Dimensions': '8" x 6" x 3"',
      'Base': 'Leather wrapped',
      'Colors': 'Black, Brown, Tan'
    }
  },

  // Electronics (5 products)
  {
    id: '13',
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
    id: '14',
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
  {
    id: '15',
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop'
    ],
    category: 'Electronics',
    brand: 'ChargeTech',
    rating: 4.4,
    reviewCount: 67,
    inStock: true,
    stockCount: 20,
    tags: ['wireless', 'charging', 'qi-compatible', 'fast-charge'],
    specifications: {
      'Output': '15W',
      'Compatibility': 'Qi-enabled devices',
      'LED Indicator': 'Yes',
      'Material': 'Silicone + ABS'
    }
  },
  {
    id: '16',
    name: '4K Ultra HD Smart TV',
    description: '55-inch 4K Ultra HD Smart TV with HDR support, built-in streaming apps, and voice control. Perfect for home entertainment.',
    price: 599.99,
    originalPrice: 799.99,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1461151304267-b35a2240c6d5?w=500&h=500&fit=crop'
    ],
    category: 'Electronics',
    brand: 'TechVision',
    rating: 4.6,
    reviewCount: 234,
    inStock: true,
    stockCount: 8,
    tags: ['4k', 'smart-tv', 'hdr', 'streaming', 'voice-control'],
    specifications: {
      'Screen Size': '55 inches',
      'Resolution': '4K Ultra HD (3840x2160)',
      'HDR': 'HDR10, Dolby Vision',
      'Smart Features': 'Built-in Apps, Voice Control',
      'Connectivity': 'WiFi, Bluetooth, 4 HDMI ports'
    }
  },
  {
    id: '17',
    name: 'Gaming Laptop - High Performance',
    description: 'Powerful gaming laptop with RTX graphics, high refresh rate display, and RGB keyboard. Perfect for gaming and content creation.',
    price: 1299.99,
    originalPrice: 1599.99,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'
    ],
    category: 'Electronics',
    brand: 'GameTech',
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    stockCount: 6,
    tags: ['gaming', 'laptop', 'rtx', 'high-performance', 'rgb'],
    specifications: {
      'Processor': 'Intel i7-12700H',
      'Graphics': 'NVIDIA RTX 4060',
      'RAM': '16GB DDR4',
      'Storage': '512GB SSD',
      'Display': '15.6" 144Hz FHD'
    }
  },

  // Clothing (5 products)
  {
    id: '18',
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
    id: '19',
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
  },
  {
    id: '20',
    name: 'Winter Wool Coat - Women\'s',
    description: 'Elegant wool coat perfect for winter. Features a classic design, warm lining, and premium wool construction.',
    price: 189.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1591047139820-dc7fd73f61a3?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1591047139820-dc7fd73f61a3?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop'
    ],
    category: 'Clothing',
    brand: 'WoolCraft',
    rating: 4.6,
    reviewCount: 92,
    inStock: true,
    stockCount: 18,
    tags: ['wool', 'coat', 'womens', 'winter', 'elegant'],
    specifications: {
      'Material': '100% Wool',
      'Lining': 'Polyester',
      'Closure': 'Button',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Dry Clean Only'
    }
  },
  {
    id: '21',
    name: 'Athletic Sneakers - Running',
    description: 'High-performance running sneakers with advanced cushioning and breathable mesh upper. Perfect for athletes and fitness enthusiasts.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop'
    ],
    category: 'Clothing',
    brand: 'RunMax',
    rating: 4.5,
    reviewCount: 145,
    inStock: true,
    stockCount: 42,
    tags: ['sneakers', 'running', 'athletic', 'breathable'],
    specifications: {
      'Upper': 'Mesh and Synthetic',
      'Sole': 'Rubber with Air Cushioning',
      'Weight': '280g',
      'Sizes': '7-12',
      'Colors': 'Black, White, Navy'
    }
  },
  {
    id: '22',
    name: 'Formal Dress Shirt - Men\'s',
    description: 'Classic formal dress shirt made from premium cotton. Perfect for business meetings, weddings, and formal occasions.',
    price: 69.99,
    originalPrice: 89.99,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop'
    ],
    category: 'Clothing',
    brand: 'FormalWear',
    rating: 4.3,
    reviewCount: 78,
    inStock: true,
    stockCount: 28,
    tags: ['formal', 'dress-shirt', 'mens', 'cotton', 'business'],
    specifications: {
      'Material': '100% Cotton',
      'Fit': 'Classic',
      'Collar': 'Spread',
      'Sizes': 'S, M, L, XL, XXL',
      'Care': 'Machine Wash Cold'
    }
  },

  // Home & Kitchen (5 products)
  {
    id: '23',
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and eco-friendly.',
    price: 24.99,
    originalPrice: 34.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Home & Kitchen',
    brand: 'HydroLife',
    rating: 4.6,
    reviewCount: 156,
    inStock: true,
    stockCount: 30,
    tags: ['insulated', 'stainless-steel', 'eco-friendly', 'bpa-free'],
    specifications: {
      'Capacity': '32 oz',
      'Material': '18/8 Stainless Steel',
      'Insulation': 'Double Wall Vacuum',
      'Lid Type': 'Screw Top'
    }
  },
  {
    id: '24',
    name: 'Non-Stick Cookware Set',
    description: 'Professional 10-piece non-stick cookware set with ceramic coating. Perfect for healthy cooking and easy cleanup.',
    price: 149.99,
    originalPrice: 199.99,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
    ],
    category: 'Home & Kitchen',
    brand: 'CookPro',
    rating: 4.4,
    reviewCount: 89,
    inStock: true,
    stockCount: 15,
    tags: ['cookware', 'non-stick', 'ceramic', 'healthy-cooking'],
    specifications: {
      'Pieces': '10',
      'Coating': 'Ceramic Non-Stick',
      'Material': 'Aluminum',
      'Compatibility': 'All Cooktops',
      'Care': 'Dishwasher Safe'
    }
  },
  {
    id: '25',
    name: 'Smart Coffee Maker',
    description: 'Programmable smart coffee maker with WiFi connectivity, app control, and built-in grinder. Perfect for coffee enthusiasts.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&h=500&fit=crop'
    ],
    category: 'Home & Kitchen',
    brand: 'BrewTech',
    rating: 4.7,
    reviewCount: 134,
    inStock: true,
    stockCount: 12,
    tags: ['coffee-maker', 'smart', 'wifi', 'programmable', 'grinder'],
    specifications: {
      'Capacity': '12 cups',
      'Connectivity': 'WiFi, Bluetooth',
      'Features': 'Built-in Grinder, Programmable',
      'Material': 'Stainless Steel',
      'App Control': 'Yes'
    }
  },
  {
    id: '26',
    name: 'Air Purifier - HEPA Filter',
    description: 'High-efficiency air purifier with HEPA filter, smart sensors, and quiet operation. Perfect for improving indoor air quality.',
    price: 179.99,
    originalPrice: 229.99,
    image: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'
    ],
    category: 'Home & Kitchen',
    brand: 'AirClean',
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
    stockCount: 20,
    tags: ['air-purifier', 'hepa', 'smart', 'quiet', 'air-quality'],
    specifications: {
      'Filter Type': 'HEPA + Activated Carbon',
      'Coverage': '500 sq ft',
      'Noise Level': '25dB',
      'Features': 'Smart Sensors, Auto Mode',
      'Filter Life': '12 months'
    }
  },
  {
    id: '27',
    name: 'Kitchen Knife Set - Professional',
    description: 'Professional 8-piece knife set with high-carbon steel blades and ergonomic handles. Perfect for serious home cooks.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop'
    ],
    category: 'Home & Kitchen',
    brand: 'ChefPro',
    rating: 4.8,
    reviewCount: 203,
    inStock: true,
    stockCount: 25,
    tags: ['knives', 'professional', 'steel', 'kitchen', 'sharp'],
    specifications: {
      'Pieces': '8',
      'Blade Material': 'High-Carbon Steel',
      'Handle': 'Ergonomic Wood',
      'Sharpness': 'Razor Sharp',
      'Care': 'Hand Wash Only'
    }
  },

  // Food & Beverage (5 products)
  {
    id: '28',
    name: 'Premium Coffee Beans',
    description: 'Single-origin coffee beans from Ethiopia. Medium roast with notes of citrus and chocolate. Perfect for coffee enthusiasts.',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&h=500&fit=crop'
    ],
    category: 'Food & Beverage',
    brand: 'BeanCraft',
    rating: 4.8,
    reviewCount: 94,
    inStock: true,
    stockCount: 40,
    tags: ['coffee', 'single-origin', 'ethiopia', 'medium-roast'],
    specifications: {
      'Origin': 'Ethiopia',
      'Roast Level': 'Medium',
      'Weight': '12 oz',
      'Flavor Notes': 'Citrus, Chocolate'
    }
  },
  {
    id: '29',
    name: 'Organic Green Tea',
    description: 'Premium organic green tea from Japan. Rich in antioxidants with a delicate, refreshing flavor. Perfect for daily wellness.',
    price: 24.99,
    originalPrice: 29.99,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&h=500&fit=crop'
    ],
    category: 'Food & Beverage',
    brand: 'TeaZen',
    rating: 4.6,
    reviewCount: 78,
    inStock: true,
    stockCount: 35,
    tags: ['tea', 'green-tea', 'organic', 'japan', 'antioxidants'],
    specifications: {
      'Origin': 'Japan',
      'Type': 'Organic Green Tea',
      'Weight': '100g',
      'Caffeine': 'Low',
      'Antioxidants': 'High'
    }
  },
  {
    id: '30',
    name: 'Artisan Chocolate Box',
    description: 'Luxury artisan chocolate box with 12 handcrafted pieces. Made from premium Belgian chocolate with unique flavor combinations.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop'
    ],
    category: 'Food & Beverage',
    brand: 'ChocoArt',
    rating: 4.9,
    reviewCount: 156,
    inStock: true,
    stockCount: 22,
    tags: ['chocolate', 'artisan', 'belgian', 'luxury', 'gift'],
    specifications: {
      'Origin': 'Belgium',
      'Pieces': '12',
      'Cocoa Content': '70%',
      'Flavors': 'Mixed',
      'Packaging': 'Gift Box'
    }
  },
  {
    id: '31',
    name: 'Craft Beer Selection',
    description: 'Curated selection of 6 craft beers from local breweries. Features IPAs, stouts, and lagers for beer enthusiasts.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=500&h=500&fit=crop'
    ],
    category: 'Food & Beverage',
    brand: 'BrewCraft',
    rating: 4.4,
    reviewCount: 89,
    inStock: true,
    stockCount: 18,
    tags: ['beer', 'craft', 'selection', 'local', 'variety'],
    specifications: {
      'Quantity': '6 bottles',
      'Types': 'IPA, Stout, Lager',
      'Origin': 'Local Breweries',
      'ABV': '5-8%',
      'Volume': '330ml each'
    }
  },
  {
    id: '32',
    name: 'Organic Honey - Wildflower',
    description: 'Pure organic wildflower honey from local beekeepers. Raw, unfiltered, and packed with natural goodness.',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Food & Beverage',
    brand: 'HoneyPure',
    rating: 4.7,
    reviewCount: 112,
    inStock: true,
    stockCount: 45,
    tags: ['honey', 'organic', 'wildflower', 'raw', 'local'],
    specifications: {
      'Type': 'Wildflower',
      'Processing': 'Raw, Unfiltered',
      'Weight': '500g',
      'Origin': 'Local Beekeepers',
      'Certification': 'Organic'
    }
  },

  // Sports & Outdoors (5 products)
  {
    id: '33',
    name: 'Yoga Mat - Premium',
    description: 'High-quality yoga mat with excellent grip and cushioning. Perfect for yoga, pilates, and fitness routines.',
    price: 49.99,
    originalPrice: 69.99,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop'
    ],
    category: 'Sports & Outdoors',
    brand: 'YogaPro',
    rating: 4.6,
    reviewCount: 187,
    inStock: true,
    stockCount: 35,
    tags: ['yoga', 'mat', 'fitness', 'grip', 'cushioning'],
    specifications: {
      'Material': 'TPE',
      'Thickness': '6mm',
      'Dimensions': '72" x 24"',
      'Weight': '2.5 lbs',
      'Grip': 'Non-slip'
    }
  },
  {
    id: '34',
    name: 'Resistance Bands Set',
    description: 'Complete resistance bands set with 5 different resistance levels. Perfect for home workouts and strength training.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop'
    ],
    category: 'Sports & Outdoors',
    brand: 'FitBand',
    rating: 4.4,
    reviewCount: 134,
    inStock: true,
    stockCount: 28,
    tags: ['resistance-bands', 'workout', 'strength-training', 'home-gym'],
    specifications: {
      'Bands': '5 different resistance levels',
      'Material': 'Natural Latex',
      'Length': '48 inches',
      'Colors': '5 different colors',
      'Accessories': 'Door anchor, handles'
    }
  },
  {
    id: '35',
    name: 'Hiking Backpack - 40L',
    description: 'Durable hiking backpack with 40L capacity, multiple compartments, and comfortable suspension system. Perfect for outdoor adventures.',
    price: 89.99,
    originalPrice: 119.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop'
    ],
    category: 'Sports & Outdoors',
    brand: 'HikePro',
    rating: 4.5,
    reviewCount: 92,
    inStock: true,
    stockCount: 15,
    tags: ['backpack', 'hiking', 'outdoor', '40l', 'durable'],
    specifications: {
      'Capacity': '40L',
      'Material': 'Ripstop Nylon',
      'Weight': '3.2 lbs',
      'Compartments': 'Main + 3 exterior',
      'Suspension': 'Adjustable'
    }
  },
  {
    id: '36',
    name: 'Water Bottle - Insulated',
    description: 'Double-wall insulated water bottle that keeps drinks cold for 24 hours. Perfect for sports, gym, and outdoor activities.',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop'
    ],
    category: 'Sports & Outdoors',
    brand: 'SportBottle',
    rating: 4.7,
    reviewCount: 203,
    inStock: true,
    stockCount: 42,
    tags: ['water-bottle', 'insulated', 'sports', 'gym', 'outdoor'],
    specifications: {
      'Capacity': '32 oz',
      'Insulation': 'Double Wall',
      'Material': 'Stainless Steel',
      'Cold Retention': '24 hours',
      'Hot Retention': '12 hours'
    }
  },
  {
    id: '37',
    name: 'Tennis Racket - Professional',
    description: 'Professional tennis racket with advanced string technology and lightweight frame. Perfect for intermediate to advanced players.',
    price: 149.99,
    originalPrice: 199.99,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop'
    ],
    category: 'Sports & Outdoors',
    brand: 'TennisPro',
    rating: 4.6,
    reviewCount: 78,
    inStock: true,
    stockCount: 12,
    tags: ['tennis', 'racket', 'professional', 'lightweight', 'advanced'],
    specifications: {
      'Head Size': '100 sq in',
      'Weight': '300g',
      'String Pattern': '16x19',
      'Grip Size': '4 3/8',
      'Frame': 'Graphite'
    }
  },

  // Books (5 products)
  {
    id: '38',
    name: 'The Psychology of Money',
    description: 'Bestselling book about the psychology of money and personal finance. Essential reading for anyone interested in financial success.',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop'
    ],
    category: 'Books',
    brand: 'FinancePress',
    rating: 4.8,
    reviewCount: 234,
    inStock: true,
    stockCount: 50,
    tags: ['finance', 'psychology', 'money', 'personal-finance', 'bestseller'],
    specifications: {
      'Author': 'Morgan Housel',
      'Pages': '256',
      'Format': 'Hardcover',
      'Language': 'English',
      'Publisher': 'Harriman House'
    }
  },
  {
    id: '39',
    name: 'Atomic Habits',
    description: 'The definitive guide to building good habits and breaking bad ones. A practical framework for improving your life.',
    price: 18.99,
    originalPrice: 24.99,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop'
    ],
    category: 'Books',
    brand: 'SelfHelpBooks',
    rating: 4.9,
    reviewCount: 456,
    inStock: true,
    stockCount: 75,
    tags: ['habits', 'self-improvement', 'productivity', 'psychology', 'bestseller'],
    specifications: {
      'Author': 'James Clear',
      'Pages': '320',
      'Format': 'Paperback',
      'Language': 'English',
      'Publisher': 'Avery'
    }
  },
  {
    id: '40',
    name: 'The Lean Startup',
    description: 'Revolutionary approach to business and entrepreneurship. Learn how to build a successful startup with minimal resources.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop'
    ],
    category: 'Books',
    brand: 'BusinessBooks',
    rating: 4.5,
    reviewCount: 189,
    inStock: true,
    stockCount: 32,
    tags: ['startup', 'business', 'entrepreneurship', 'lean', 'innovation'],
    specifications: {
      'Author': 'Eric Ries',
      'Pages': '336',
      'Format': 'Paperback',
      'Language': 'English',
      'Publisher': 'Crown Business'
    }
  },
  {
    id: '41',
    name: 'Sapiens: A Brief History of Humankind',
    description: 'Fascinating exploration of human history and evolution. A thought-provoking book that challenges our understanding of humanity.',
    price: 17.99,
    originalPrice: 22.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop'
    ],
    category: 'Books',
    brand: 'HistoryPress',
    rating: 4.7,
    reviewCount: 312,
    inStock: true,
    stockCount: 28,
    tags: ['history', 'anthropology', 'evolution', 'humanity', 'philosophy'],
    specifications: {
      'Author': 'Yuval Noah Harari',
      'Pages': '443',
      'Format': 'Paperback',
      'Language': 'English',
      'Publisher': 'Harper'
    }
  },
  {
    id: '42',
    name: 'The 7 Habits of Highly Effective People',
    description: 'Classic self-help book that has helped millions of people improve their personal and professional lives through powerful habits.',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop'
    ],
    category: 'Books',
    brand: 'SelfHelpBooks',
    rating: 4.6,
    reviewCount: 567,
    inStock: true,
    stockCount: 65,
    tags: ['self-help', 'productivity', 'leadership', 'habits', 'classic'],
    specifications: {
      'Author': 'Stephen R. Covey',
      'Pages': '432',
      'Format': 'Paperback',
      'Language': 'English',
      'Publisher': 'Free Press'
    }
  }
];

export const categories = [
  { id: 'leather-goods', name: 'Leather Goods', slug: 'leather-goods' },
  { id: 'electronics', name: 'Electronics', slug: 'electronics' },
  { id: 'clothing', name: 'Clothing', slug: 'clothing' },
  { id: 'home-kitchen', name: 'Home & Kitchen', slug: 'home-kitchen' },
  { id: 'food-beverage', name: 'Food & Beverage', slug: 'food-beverage' },
  { id: 'sports', name: 'Sports & Outdoors', slug: 'sports' },
  { id: 'books', name: 'Books', slug: 'books' }
];
