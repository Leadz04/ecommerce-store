import mongoose, { Document, Schema } from 'mongoose';

export interface IProductBundle extends Document {
  _id: string;
  name: string;
  description: string;
  products: Array<{
    productId: string;
    quantity: number;
    required: boolean; // If false, product is optional in bundle
  }>;
  bundlePrice: number; // Special price for the bundle
  originalTotalPrice: number; // Sum of individual product prices
  discountPercent: number; // Calculated discount percentage
  image?: string;
  images?: string[];
  category?: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  stockCount?: number;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BundleProductSchema = new Schema({
  productId: {
    type: String,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  required: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const ProductBundleSchema = new Schema<IProductBundle>({
  name: {
    type: String,
    required: [true, 'Bundle name is required'],
    trim: true,
    maxlength: [200, 'Bundle name cannot be more than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Bundle description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters'],
  },
  products: [BundleProductSchema],
  bundlePrice: {
    type: Number,
    required: [true, 'Bundle price is required'],
    min: [0, 'Bundle price cannot be negative'],
  },
  originalTotalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  image: String,
  images: [String],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Children', 'Office & Travel', 'Accessories', 'Gifting', 'Wool', 'Footwear'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: Date,
  endDate: Date,
  stockCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
ProductBundleSchema.index({ isActive: 1, inStock: 1 });
ProductBundleSchema.index({ category: 1 });
ProductBundleSchema.index({ 'products.productId': 1 });

export default mongoose.models.ProductBundle || mongoose.model<IProductBundle>('ProductBundle', ProductBundleSchema);

