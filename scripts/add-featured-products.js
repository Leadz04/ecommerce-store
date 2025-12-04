const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Product Schema
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
  descriptionHtml: {
    type: String,
    required: false,
    maxlength: [20000, 'HTML description too long']
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
  imageAltTexts: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: {
    type: String,
    trim: true
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
    required: false,
    default: 0,
    min: [0, 'Stock count cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  productType: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Featured Products Data
const featuredProducts = [
  {
    name: 'Premium Leather Crossbody Bag',
    description: 'Handcrafted premium leather crossbody bag with adjustable strap. Features multiple compartments, secure zipper closure, and elegant design. Perfect for everyday use, travel, or special occasions. Made from genuine leather with attention to detail and durability.',
    descriptionHtml: '<p>Handcrafted premium leather crossbody bag with adjustable strap. Features multiple compartments, secure zipper closure, and elegant design.</p><p>Perfect for everyday use, travel, or special occasions. Made from genuine leather with attention to detail and durability.</p><ul><li>Genuine leather construction</li><li>Adjustable strap (24-48 inches)</li><li>Multiple interior compartments</li><li>Secure zipper closure</li><li>Dimensions: 10" x 7" x 3"</li></ul>',
    price: 89.99,
    originalPrice: 129.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Premium leather crossbody bag front view',
      'Premium leather crossbody bag side view showing compartments',
      'Premium leather crossbody bag interior view',
      'Premium leather crossbody bag being worn'
    ],
    category: 'Women',
    brand: 'EverStyleCrafts',
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    stockCount: 45,
    tags: ['leather', 'crossbody', 'handbag', 'premium', 'handcrafted', 'women'],
    specifications: {
      'Material': 'Genuine Leather',
      'Dimensions': '10" x 7" x 3"',
      'Strap Length': 'Adjustable 24-48 inches',
      'Weight': '1.2 lbs',
      'Color': 'Brown',
      'Closure': 'Zipper',
      'Compartments': '3 interior + 1 exterior'
    },
    isActive: true,
    status: 'published',
    productType: 'Bag'
  },
  {
    name: 'Classic Men\'s Leather Wallet',
    description: 'Sleek and sophisticated men\'s leather wallet with RFID blocking technology. Features multiple card slots, cash compartment, and ID window. Made from premium full-grain leather that ages beautifully. Compact design fits comfortably in any pocket.',
    descriptionHtml: '<p>Sleek and sophisticated men\'s leather wallet with RFID blocking technology. Features multiple card slots, cash compartment, and ID window.</p><p>Made from premium full-grain leather that ages beautifully. Compact design fits comfortably in any pocket.</p><ul><li>RFID blocking technology</li><li>8 card slots</li><li>Cash compartment</li><li>ID window</li><li>Full-grain leather</li></ul>',
    price: 49.99,
    originalPrice: 79.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Classic men\'s leather wallet closed view',
      'Classic men\'s leather wallet open showing card slots',
      'Classic men\'s leather wallet detail view'
    ],
    category: 'Men',
    brand: 'EverStyleCrafts',
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    stockCount: 78,
    tags: ['wallet', 'leather', 'men', 'rfid', 'premium', 'classic'],
    specifications: {
      'Material': 'Full-Grain Leather',
      'Dimensions': '4.5" x 3.5" x 0.5"',
      'Card Slots': '8',
      'RFID Blocking': 'Yes',
      'Color': 'Black',
      'Weight': '0.2 lbs'
    },
    isActive: true,
    status: 'published',
    productType: 'Wallet'
  },
  {
    name: 'Luxury Travel Backpack',
    description: 'Premium travel backpack designed for comfort and functionality. Features padded laptop compartment, multiple pockets, water-resistant material, and ergonomic padded straps. Perfect for business travel, daily commute, or weekend adventures.',
    descriptionHtml: '<p>Premium travel backpack designed for comfort and functionality. Features padded laptop compartment, multiple pockets, water-resistant material, and ergonomic padded straps.</p><p>Perfect for business travel, daily commute, or weekend adventures.</p><ul><li>Padded laptop compartment (fits up to 15")</li><li>Water-resistant material</li><li>Ergonomic padded straps</li><li>Multiple organizational pockets</li><li>TSA-friendly design</li></ul>',
    price: 129.99,
    originalPrice: 179.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Luxury travel backpack front view',
      'Luxury travel backpack showing laptop compartment',
      'Luxury travel backpack interior view',
      'Luxury travel backpack being worn'
    ],
    category: 'Office & Travel',
    brand: 'EverStyleCrafts',
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    stockCount: 32,
    tags: ['backpack', 'travel', 'laptop', 'business', 'premium', 'water-resistant'],
    specifications: {
      'Capacity': '30L',
      'Laptop Compartment': 'Up to 15"',
      'Material': 'Water-Resistant Nylon',
      'Dimensions': '18" x 13" x 8"',
      'Weight': '2.5 lbs',
      'Color': 'Navy Blue',
      'Straps': 'Padded, Adjustable'
    },
    isActive: true,
    status: 'published',
    productType: 'Backpack'
  },
  {
    name: 'Designer Sunglasses - Classic Aviator',
    description: 'Stylish aviator sunglasses with UV400 protection and polarized lenses. Features lightweight metal frame, comfortable nose pads, and premium lens coating. Perfect for sunny days, driving, or outdoor activities. Includes protective case and cleaning cloth.',
    descriptionHtml: '<p>Stylish aviator sunglasses with UV400 protection and polarized lenses. Features lightweight metal frame, comfortable nose pads, and premium lens coating.</p><p>Perfect for sunny days, driving, or outdoor activities. Includes protective case and cleaning cloth.</p><ul><li>UV400 protection</li><li>Polarized lenses</li><li>Lightweight metal frame</li><li>Comfortable nose pads</li><li>Includes case and cleaning cloth</li></ul>',
    price: 69.99,
    originalPrice: 99.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Designer aviator sunglasses front view',
      'Designer aviator sunglasses side view',
      'Designer aviator sunglasses in case'
    ],
    category: 'Accessories',
    brand: 'EverStyleCrafts',
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    stockCount: 56,
    tags: ['sunglasses', 'aviator', 'polarized', 'uv-protection', 'accessories'],
    specifications: {
      'Lens Type': 'Polarized',
      'UV Protection': 'UV400',
      'Frame Material': 'Metal',
      'Lens Material': 'Polycarbonate',
      'Frame Width': '140mm',
      'Lens Width': '58mm',
      'Bridge': '18mm',
      'Temple Length': '145mm'
    },
    isActive: true,
    status: 'published',
    productType: 'Sunglasses'
  },
  {
    name: 'Premium Leather Watch - Men\'s Classic',
    description: 'Elegant men\'s leather watch with automatic movement and sapphire crystal. Features genuine leather strap, date display, and water resistance up to 50m. Classic design that complements both casual and formal attire. Perfect gift for any occasion.',
    descriptionHtml: '<p>Elegant men\'s leather watch with automatic movement and sapphire crystal. Features genuine leather strap, date display, and water resistance up to 50m.</p><p>Classic design that complements both casual and formal attire. Perfect gift for any occasion.</p><ul><li>Automatic movement</li><li>Sapphire crystal</li><li>Genuine leather strap</li><li>Date display</li><li>Water resistant 50m</li></ul>',
    price: 199.99,
    originalPrice: 299.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Premium leather watch front view',
      'Premium leather watch showing dial detail',
      'Premium leather watch on wrist',
      'Premium leather watch case and packaging'
    ],
    category: 'Men',
    brand: 'EverStyleCrafts',
    rating: 4.8,
    reviewCount: 142,
    inStock: true,
    stockCount: 28,
    tags: ['watch', 'leather', 'men', 'automatic', 'premium', 'classic', 'gift'],
    specifications: {
      'Movement': 'Automatic',
      'Case Material': 'Stainless Steel',
      'Case Diameter': '42mm',
      'Strap Material': 'Genuine Leather',
      'Strap Width': '22mm',
      'Crystal': 'Sapphire',
      'Water Resistance': '50m',
      'Features': 'Date Display'
    },
    isActive: true,
    status: 'published',
    productType: 'Watch'
  },
  {
    name: 'Elegant Pearl Necklace Set',
    description: 'Beautiful pearl necklace set with matching earrings. Features genuine cultured pearls, sterling silver clasps, and elegant design. Perfect for special occasions, weddings, or as a timeless gift. Includes velvet gift box for presentation.',
    descriptionHtml: '<p>Beautiful pearl necklace set with matching earrings. Features genuine cultured pearls, sterling silver clasps, and elegant design.</p><p>Perfect for special occasions, weddings, or as a timeless gift. Includes velvet gift box for presentation.</p><ul><li>Genuine cultured pearls</li><li>Sterling silver clasps</li><li>Matching earrings included</li><li>Velvet gift box</li><li>Adjustable length</li></ul>',
    price: 149.99,
    originalPrice: 219.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Elegant pearl necklace set displayed',
      'Elegant pearl necklace being worn',
      'Elegant pearl necklace set with earrings',
      'Elegant pearl necklace set in gift box'
    ],
    category: 'Women',
    brand: 'EverStyleCrafts',
    rating: 4.9,
    reviewCount: 98,
    inStock: true,
    stockCount: 41,
    tags: ['pearl', 'necklace', 'jewelry', 'women', 'elegant', 'gift', 'formal'],
    specifications: {
      'Pearl Type': 'Cultured Pearls',
      'Necklace Length': '18" (adjustable)',
      'Clasp Material': 'Sterling Silver',
      'Earrings Included': 'Yes',
      'Gift Box': 'Velvet Box Included',
      'Pearl Size': '7-8mm'
    },
    isActive: true,
    status: 'published',
    productType: 'Jewelry'
  },
  {
    name: 'Artisan Coffee Gift Set',
    description: 'Premium coffee gift set featuring hand-selected beans, French press, and artisanal mugs. Perfect for coffee enthusiasts or as a thoughtful gift. Includes three varieties of specialty coffee beans, stainless steel French press, and two ceramic mugs.',
    descriptionHtml: '<p>Premium coffee gift set featuring hand-selected beans, French press, and artisanal mugs. Perfect for coffee enthusiasts or as a thoughtful gift.</p><p>Includes three varieties of specialty coffee beans, stainless steel French press, and two ceramic mugs.</p><ul><li>3 varieties of specialty coffee beans</li><li>Stainless steel French press</li><li>2 ceramic mugs</li><li>Brewing guide included</li><li>Gift-ready packaging</li></ul>',
    price: 79.99,
    originalPrice: 119.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Artisan coffee gift set complete view',
      'Artisan coffee gift set showing contents',
      'Artisan coffee gift set packaging'
    ],
    category: 'Gifting',
    brand: 'EverStyleCrafts',
    rating: 4.7,
    reviewCount: 67,
    inStock: true,
    stockCount: 52,
    tags: ['coffee', 'gift', 'set', 'premium', 'artisan', 'beverage'],
    specifications: {
      'Coffee Beans': '3 Varieties (8oz each)',
      'French Press': 'Stainless Steel, 34oz',
      'Mugs': '2 Ceramic Mugs',
      'Packaging': 'Gift Box',
      'Total Weight': '2.5 lbs'
    },
    isActive: true,
    status: 'published',
    productType: 'Gift Set'
  },
  {
    name: 'Professional Laptop Sleeve',
    description: 'Sleek laptop sleeve with padded protection and premium materials. Features water-resistant exterior, soft interior lining, and convenient front pocket. Fits laptops up to 15.6 inches. Perfect for professionals, students, or anyone who values style and protection.',
    descriptionHtml: '<p>Sleek laptop sleeve with padded protection and premium materials. Features water-resistant exterior, soft interior lining, and convenient front pocket.</p><p>Fits laptops up to 15.6 inches. Perfect for professionals, students, or anyone who values style and protection.</p><ul><li>Padded protection</li><li>Water-resistant exterior</li><li>Soft interior lining</li><li>Front pocket for accessories</li><li>Fits up to 15.6" laptops</li></ul>',
    price: 39.99,
    originalPrice: 59.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Professional laptop sleeve front view',
      'Professional laptop sleeve with laptop inside',
      'Professional laptop sleeve showing interior'
    ],
    category: 'Office & Travel',
    brand: 'EverStyleCrafts',
    rating: 4.5,
    reviewCount: 124,
    inStock: true,
    stockCount: 89,
    tags: ['laptop', 'sleeve', 'protection', 'office', 'travel', 'accessories'],
    specifications: {
      'Laptop Size': 'Up to 15.6"',
      'Material': 'Water-Resistant Nylon',
      'Interior': 'Soft Padded Lining',
      'Pockets': '1 Front Pocket',
      'Dimensions': '16" x 11.5" x 1"',
      'Color': 'Charcoal Gray'
    },
    isActive: true,
    status: 'published',
    productType: 'Laptop Accessory'
  }
];

async function addFeaturedProducts() {
  try {
    await connectDB();
    
    console.log('🚀 Starting to add featured products...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const productData of featuredProducts) {
      try {
        // Check if product already exists
        const existing = await Product.findOne({ 
          name: productData.name,
          brand: productData.brand 
        });
        
        if (existing) {
          console.log(`⏭️  Skipping "${productData.name}" - already exists`);
          skipped++;
          continue;
        }
        
        // Convert specifications object to Map
        const specsMap = new Map();
        if (productData.specifications) {
          Object.entries(productData.specifications).forEach(([key, value]) => {
            specsMap.set(key, value);
          });
        }
        
        const product = new Product({
          ...productData,
          specifications: specsMap
        });
        
        await product.save();
        console.log(`✅ Created: "${productData.name}" - $${productData.price}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating "${productData.name}":`, error.message);
      }
    }
    
    console.log(`\n✨ Completed!`);
    console.log(`   Created: ${created} products`);
    console.log(`   Skipped: ${skipped} products (already exist)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
addFeaturedProducts();

