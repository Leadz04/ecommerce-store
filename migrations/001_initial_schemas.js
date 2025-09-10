const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Define schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' },
  avatar: { type: String },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  brand: { type: String },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  specifications: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  weight: { type: Number },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending' 
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  paymentMethod: String,
  paymentIntentId: String,
  trackingNumber: String,
  notes: String
}, { timestamps: true });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const OrderCounterSchema = new mongoose.Schema({
  _id: { type: String, default: 'orderCounter' },
  sequence_value: { type: Number, default: 0 }
});

module.exports = {
  version: '001',
  name: 'initial_schemas',
  description: 'Create initial database schemas for User, Product, Order, Role, and OrderCounter models',
  
  async up() {
    console.log('  📝 Creating initial database schemas...');
    
    await connectDB();
    
    // Create models
    const User = mongoose.model('User', UserSchema);
    const Product = mongoose.model('Product', ProductSchema);
    const Order = mongoose.model('Order', OrderSchema);
    const Role = mongoose.model('Role', RoleSchema);
    const OrderCounter = mongoose.model('OrderCounter', OrderCounterSchema);
    
    // Create indexes for better performance
    console.log('  📊 Creating indexes...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    
    // Product indexes
    await Product.collection.createIndex({ name: 'text', description: 'text', tags: 'text' });
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ brand: 1 });
    await Product.collection.createIndex({ price: 1 });
    await Product.collection.createIndex({ rating: -1 });
    await Product.collection.createIndex({ inStock: 1 });
    
    // Order indexes
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });
    await Order.collection.createIndex({ userId: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    await Order.collection.createIndex({ 'items.productId': 1 });
    
    // Role indexes
    await Role.collection.createIndex({ name: 1 }, { unique: true });
    
    // OrderCounter indexes
    await OrderCounter.collection.createIndex({ _id: 1 });
    
    console.log('  ✅ Initial schemas and indexes created successfully');
  },
  
  async down() {
    console.log('  🔄 Rolling back initial schemas...');
    
    await connectDB();
    
    // Drop all collections
    await mongoose.connection.db.collection('users').drop();
    await mongoose.connection.db.collection('products').drop();
    await mongoose.connection.db.collection('orders').drop();
    await mongoose.connection.db.collection('roles').drop();
    await mongoose.connection.db.collection('ordercounters').drop();
    
    console.log('  ✅ Initial schemas rolled back');
  }
};
