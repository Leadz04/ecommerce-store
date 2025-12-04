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

// Jackets Data - Half Men's, Half Women's
const jackets = [
  // Men's Jackets (4 items)
  {
    name: 'Classic Men\'s Leather Jacket - Black',
    description: 'Premium genuine leather jacket for men with classic biker style. Features quilted lining, multiple pockets, and adjustable cuffs. Made from high-quality cowhide leather that becomes more comfortable with wear. Perfect for casual outings, motorcycle riding, or adding edge to any outfit.',
    descriptionHtml: '<p>Premium genuine leather jacket for men with classic biker style. Features quilted lining, multiple pockets, and adjustable cuffs.</p><p>Made from high-quality cowhide leather that becomes more comfortable with wear. Perfect for casual outings, motorcycle riding, or adding edge to any outfit.</p><ul><li>100% Genuine Cowhide Leather</li><li>Quilted Lining for Warmth</li><li>Multiple Pockets (2 chest, 2 side)</li><li>Adjustable Cuffs and Waist</li><li>Classic Biker Style</li></ul>',
    price: 249.99,
    originalPrice: 349.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Classic men\'s black leather jacket front view',
      'Classic men\'s black leather jacket side view',
      'Classic men\'s black leather jacket detail showing pockets',
      'Classic men\'s black leather jacket being worn'
    ],
    category: 'Men',
    brand: 'EverStyleCrafts',
    rating: 4.8,
    reviewCount: 156,
    inStock: true,
    stockCount: 42,
    tags: ['jacket', 'leather', 'men', 'biker', 'black', 'premium', 'classic'],
    specifications: {
      'Material': '100% Genuine Cowhide Leather',
      'Lining': 'Quilted Polyester',
      'Sizes': 'S, M, L, XL, XXL',
      'Pockets': '4 (2 chest, 2 side)',
      'Closure': 'Zipper',
      'Color': 'Black',
      'Weight': '3.5 lbs',
      'Care': 'Leather Conditioner Recommended'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  {
    name: 'Men\'s Denim Jacket - Blue',
    description: 'Classic denim jacket for men with timeless style. Features button closure, chest pockets, and comfortable fit. Made from premium denim fabric that softens with each wash. Versatile piece that pairs well with jeans, chinos, or casual pants. Perfect for spring and fall seasons.',
    descriptionHtml: '<p>Classic denim jacket for men with timeless style. Features button closure, chest pockets, and comfortable fit.</p><p>Made from premium denim fabric that softens with each wash. Versatile piece that pairs well with jeans, chinos, or casual pants. Perfect for spring and fall seasons.</p><ul><li>100% Cotton Denim</li><li>Button Closure</li><li>Chest Pockets</li><li>Classic Fit</li><li>Timeless Style</li></ul>',
    price: 79.99,
    originalPrice: 109.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg'
    ],
    imageAltTexts: [
      'Men\'s blue denim jacket front view',
      'Men\'s blue denim jacket side view',
      'Men\'s blue denim jacket detail'
    ],
    category: 'Men',
    brand: 'EverStyleCrafts',
    rating: 4.6,
    reviewCount: 203,
    inStock: true,
    stockCount: 67,
    tags: ['jacket', 'denim', 'men', 'blue', 'casual', 'classic', 'versatile'],
    specifications: {
      'Material': '100% Cotton Denim',
      'Sizes': 'S, M, L, XL, XXL',
      'Closure': 'Button',
      'Pockets': '2 Chest Pockets',
      'Color': 'Blue',
      'Weight': '1.8 lbs',
      'Care': 'Machine Washable'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  {
    name: 'Men\'s Bomber Jacket - Navy',
    description: 'Stylish bomber jacket for men with modern design. Features ribbed cuffs and hem, front zipper closure, and comfortable fit. Made from high-quality polyester blend with soft lining. Perfect for casual wear, weekend outings, or layering during cooler months.',
    descriptionHtml: '<p>Stylish bomber jacket for men with modern design. Features ribbed cuffs and hem, front zipper closure, and comfortable fit.</p><p>Made from high-quality polyester blend with soft lining. Perfect for casual wear, weekend outings, or layering during cooler months.</p><ul><li>Polyester Blend</li><li>Ribbed Cuffs and Hem</li><li>Zipper Closure</li><li>Soft Lining</li><li>Modern Design</li></ul>',
    price: 89.99,
    originalPrice: 129.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Men\'s navy bomber jacket front view',
      'Men\'s navy bomber jacket side view',
      'Men\'s navy bomber jacket detail',
      'Men\'s navy bomber jacket being worn'
    ],
    category: 'Men',
    brand: 'EverStyleCrafts',
    rating: 4.7,
    reviewCount: 134,
    inStock: true,
    stockCount: 53,
    tags: ['jacket', 'bomber', 'men', 'navy', 'casual', 'modern', 'stylish'],
    specifications: {
      'Material': 'Polyester Blend',
      'Lining': 'Soft Polyester',
      'Sizes': 'S, M, L, XL, XXL',
      'Closure': 'Zipper',
      'Color': 'Navy Blue',
      'Weight': '1.5 lbs',
      'Care': 'Machine Washable'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  {
    name: 'Men\'s Winter Parka - Black',
    description: 'Warm and durable winter parka for men with hood and multiple pockets. Features water-resistant outer shell, insulated lining, and adjustable hood. Perfect for cold weather, outdoor activities, or daily winter wear. Keeps you warm and dry in harsh conditions.',
    descriptionHtml: '<p>Warm and durable winter parka for men with hood and multiple pockets. Features water-resistant outer shell, insulated lining, and adjustable hood.</p><p>Perfect for cold weather, outdoor activities, or daily winter wear. Keeps you warm and dry in harsh conditions.</p><ul><li>Water-Resistant Shell</li><li>Insulated Lining</li><li>Adjustable Hood</li><li>Multiple Pockets</li><li>Warm and Durable</li></ul>',
    price: 179.99,
    originalPrice: 249.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg'
    ],
    imageAltTexts: [
      'Men\'s black winter parka front view',
      'Men\'s black winter parka with hood',
      'Men\'s black winter parka detail',
      'Men\'s black winter parka being worn'
    ],
    category: 'Men',
    brand: 'EverStyleCrafts',
    rating: 4.9,
    reviewCount: 187,
    inStock: true,
    stockCount: 38,
    tags: ['jacket', 'parka', 'men', 'winter', 'black', 'warm', 'water-resistant'],
    specifications: {
      'Material': 'Water-Resistant Polyester',
      'Insulation': 'Synthetic Fill',
      'Sizes': 'S, M, L, XL, XXL',
      'Hood': 'Adjustable with Fur Trim',
      'Pockets': '6 (2 chest, 2 side, 2 interior)',
      'Color': 'Black',
      'Weight': '2.8 lbs',
      'Temperature Rating': 'Up to -10°C'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  // Women's Jackets (4 items)
  {
    name: 'Women\'s Faux Leather Moto Jacket - Black',
    description: 'Trendy faux leather moto jacket for women with edgy style. Features asymmetrical zipper, quilted details, and flattering fit. Made from high-quality faux leather that looks and feels like real leather. Perfect for adding attitude to any outfit, day or night.',
    descriptionHtml: '<p>Trendy faux leather moto jacket for women with edgy style. Features asymmetrical zipper, quilted details, and flattering fit.</p><p>Made from high-quality faux leather that looks and feels like real leather. Perfect for adding attitude to any outfit, day or night.</p><ul><li>Premium Faux Leather</li><li>Asymmetrical Zipper</li><li>Quilted Details</li><li>Flattering Fit</li><li>Edgy Style</li></ul>',
    price: 89.99,
    originalPrice: 129.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Women\'s black faux leather moto jacket front view',
      'Women\'s black faux leather moto jacket side view',
      'Women\'s black faux leather moto jacket detail',
      'Women\'s black faux leather moto jacket being worn'
    ],
    category: 'Women',
    brand: 'EverStyleCrafts',
    rating: 4.7,
    reviewCount: 198,
    inStock: true,
    stockCount: 61,
    tags: ['jacket', 'faux-leather', 'women', 'moto', 'black', 'edgy', 'trendy'],
    specifications: {
      'Material': 'Premium Faux Leather',
      'Lining': 'Polyester',
      'Sizes': 'XS, S, M, L, XL',
      'Closure': 'Asymmetrical Zipper',
      'Color': 'Black',
      'Weight': '2.2 lbs',
      'Care': 'Spot Clean or Dry Clean'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  {
    name: 'Women\'s Denim Jacket - Light Blue',
    description: 'Classic denim jacket for women with feminine fit. Features button closure, chest pockets, and cropped length. Made from soft denim fabric that\'s comfortable and versatile. Perfect for layering over dresses, pairing with jeans, or wearing with skirts. Essential wardrobe piece.',
    descriptionHtml: '<p>Classic denim jacket for women with feminine fit. Features button closure, chest pockets, and cropped length.</p><p>Made from soft denim fabric that\'s comfortable and versatile. Perfect for layering over dresses, pairing with jeans, or wearing with skirts. Essential wardrobe piece.</p><ul><li>100% Cotton Denim</li><li>Feminine Fit</li><li>Cropped Length</li><li>Button Closure</li><li>Versatile Style</li></ul>',
    price: 69.99,
    originalPrice: 99.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg'
    ],
    imageAltTexts: [
      'Women\'s light blue denim jacket front view',
      'Women\'s light blue denim jacket side view',
      'Women\'s light blue denim jacket detail'
    ],
    category: 'Women',
    brand: 'EverStyleCrafts',
    rating: 4.8,
    reviewCount: 245,
    inStock: true,
    stockCount: 78,
    tags: ['jacket', 'denim', 'women', 'blue', 'casual', 'classic', 'versatile'],
    specifications: {
      'Material': '100% Cotton Denim',
      'Sizes': 'XS, S, M, L, XL',
      'Closure': 'Button',
      'Pockets': '2 Chest Pockets',
      'Color': 'Light Blue',
      'Weight': '1.5 lbs',
      'Care': 'Machine Washable'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  {
    name: 'Women\'s Trench Coat - Beige',
    description: 'Elegant trench coat for women with timeless style. Features double-breasted design, belted waist, and classic length. Made from water-resistant fabric with smooth lining. Perfect for professional settings, formal occasions, or everyday sophistication. A wardrobe essential.',
    descriptionHtml: '<p>Elegant trench coat for women with timeless style. Features double-breasted design, belted waist, and classic length.</p><p>Made from water-resistant fabric with smooth lining. Perfect for professional settings, formal occasions, or everyday sophistication. A wardrobe essential.</p><ul><li>Water-Resistant Fabric</li><li>Double-Breasted Design</li><li>Belted Waist</li><li>Classic Length</li><li>Timeless Style</li></ul>',
    price: 149.99,
    originalPrice: 199.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Women\'s beige trench coat front view',
      'Women\'s beige trench coat side view',
      'Women\'s beige trench coat detail',
      'Women\'s beige trench coat being worn'
    ],
    category: 'Women',
    brand: 'EverStyleCrafts',
    rating: 4.9,
    reviewCount: 167,
    inStock: true,
    stockCount: 45,
    tags: ['jacket', 'trench-coat', 'women', 'beige', 'elegant', 'classic', 'professional'],
    specifications: {
      'Material': 'Water-Resistant Polyester',
      'Lining': 'Smooth Polyester',
      'Sizes': 'XS, S, M, L, XL',
      'Closure': 'Double-Breasted with Belt',
      'Color': 'Beige',
      'Length': 'Knee-Length',
      'Weight': '2.5 lbs',
      'Care': 'Dry Clean Recommended'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  },
  {
    name: 'Women\'s Puffer Jacket - Pink',
    description: 'Stylish puffer jacket for women with modern design. Features quilted construction, hood, and zipper closure. Made from water-resistant outer shell with warm synthetic insulation. Perfect for cold weather, outdoor activities, or casual winter wear. Combines warmth with style.',
    descriptionHtml: '<p>Stylish puffer jacket for women with modern design. Features quilted construction, hood, and zipper closure.</p><p>Made from water-resistant outer shell with warm synthetic insulation. Perfect for cold weather, outdoor activities, or casual winter wear. Combines warmth with style.</p><ul><li>Water-Resistant Shell</li><li>Synthetic Insulation</li><li>Quilted Construction</li><li>Hood Included</li><li>Modern Design</li></ul>',
    price: 119.99,
    originalPrice: 169.99,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/woman.jpg',
      'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      'https://res.cloudinary.com/demo/image/upload/man.jpg'
    ],
    imageAltTexts: [
      'Women\'s pink puffer jacket front view',
      'Women\'s pink puffer jacket with hood',
      'Women\'s pink puffer jacket detail',
      'Women\'s pink puffer jacket being worn'
    ],
    category: 'Women',
    brand: 'EverStyleCrafts',
    rating: 4.6,
    reviewCount: 112,
    inStock: true,
    stockCount: 54,
    tags: ['jacket', 'puffer', 'women', 'pink', 'winter', 'warm', 'stylish'],
    specifications: {
      'Material': 'Water-Resistant Nylon',
      'Insulation': 'Synthetic Fill',
      'Sizes': 'XS, S, M, L, XL',
      'Hood': 'Detachable',
      'Closure': 'Zipper',
      'Color': 'Pink',
      'Weight': '2.0 lbs',
      'Temperature Rating': 'Up to -5°C'
    },
    isActive: true,
    status: 'published',
    productType: 'Jacket'
  }
];

async function addJackets() {
  try {
    await connectDB();
    
    console.log('🚀 Starting to add jacket products...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const jacketData of jackets) {
      try {
        // Check if product already exists
        const existing = await Product.findOne({ 
          name: jacketData.name,
          brand: jacketData.brand 
        });
        
        if (existing) {
          console.log(`⏭️  Skipping "${jacketData.name}" - already exists`);
          skipped++;
          continue;
        }
        
        // Convert specifications object to Map
        const specsMap = new Map();
        if (jacketData.specifications) {
          Object.entries(jacketData.specifications).forEach(([key, value]) => {
            specsMap.set(key, value);
          });
        }
        
        const product = new Product({
          ...jacketData,
          specifications: specsMap
        });
        
        await product.save();
        console.log(`✅ Created: "${jacketData.name}" - $${jacketData.price} (${jacketData.category})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating "${jacketData.name}":`, error.message);
      }
    }
    
    console.log(`\n✨ Completed!`);
    console.log(`   Created: ${created} jackets`);
    console.log(`   Skipped: ${skipped} jackets (already exist)`);
    console.log(`   Men's Jackets: ${jackets.filter(j => j.category === 'Men').length}`);
    console.log(`   Women's Jackets: ${jackets.filter(j => j.category === 'Women').length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
addJackets();

