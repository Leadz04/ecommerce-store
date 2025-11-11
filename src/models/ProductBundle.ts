import mongoose, { Schema, Document } from 'mongoose';

export interface IBundleProduct {
  productId: string;
  quantity: number;
  canCustomize: boolean; // Allow customer to choose variant
}

export interface IProductBundle extends Document {
  name: string;
  slug: string;
  description?: string;
  products: IBundleProduct[];
  
  // Pricing
  originalPrice: number; // Sum of individual prices
  bundlePrice: number; // Discounted bundle price
  discountPercentage: number;
  savingsAmount: number;
  
  // Display
  images?: string[];
  featured: boolean;
  isActive: boolean;
  
  // Stock
  stock?: number;
  unlimitedStock: boolean;
  
  // Metadata
  tags?: string[];
  category?: string;
  
  // Sales tracking
  salesCount: number;
  viewCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ProductBundleSchema = new Schema<IProductBundle>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: String,
  products: [{
    productId: {
      type: String,
      required: true,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    canCustomize: {
      type: Boolean,
      default: false
    }
  }],
  
  // Pricing
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  bundlePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  savingsAmount: {
    type: Number,
    min: 0
  },
  
  // Display
  images: [String],
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Stock
  stock: Number,
  unlimitedStock: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  tags: [String],
  category: String,
  
  // Sales tracking
  salesCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
ProductBundleSchema.index({ slug: 1 });
ProductBundleSchema.index({ isActive: 1, featured: 1 });
ProductBundleSchema.index({ category: 1 });

// Pre-save hook to calculate pricing
ProductBundleSchema.pre('save', function(next) {
  if (this.originalPrice && this.bundlePrice) {
    this.discountPercentage = Math.round(((this.originalPrice - this.bundlePrice) / this.originalPrice) * 100);
    this.savingsAmount = this.originalPrice - this.bundlePrice;
  }
  next();
});

// Method to check if bundle is available
ProductBundleSchema.methods.isAvailable = function(): boolean {
  if (!this.isActive) return false;
  if (!this.unlimitedStock && this.stock !== undefined && this.stock <= 0) return false;
  return true;
};

export default mongoose.models.ProductBundle || mongoose.model<IProductBundle>('ProductBundle', ProductBundleSchema);

